import {
  ApiClientError,
  isAuthFailure,
  isRetryableError,
  parseFieldErrors,
  statusToErrorCode,
} from './errors.js';

import type { RequestId } from '@c1rcle/types';

/* ─── Configuration ──────────────────────────────────────────────────────── */

export interface ApiClientConfig {
  /** Base URL for all requests, e.g. "https://api.example.com/v2". */
  readonly baseUrl: string;
  /** Called before each request to obtain the current access token. */
  readonly getAccessToken: () => string | null | Promise<string | null>;
  /** Called when a request fails with 401 and refresh also fails. */
  readonly onUnauthorized: () => void;
  /** Maximum number of network-level retries (default: 2). */
  readonly maxRetries?: number;
  /** Base timeout in ms for each request (default: 30_000). */
  readonly timeoutMs?: number;
}

/* ─── Request / Response types ───────────────────────────────────────────── */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly query?: Record<string, string | number | boolean | undefined>;
  /** AbortSignal for external cancellation. */
  readonly signal?: AbortSignal;
  /** Skip automatic auth retry on 401 (used for the refresh call itself). */
  readonly skipAuthRetry?: boolean;
  /** Skip network retry (used for non-idempotent calls if needed). */
  readonly skipRetry?: boolean;
}

/* ─── Internal helpers ───────────────────────────────────────────────────── */

/** Generate a unique request ID (crypto.randomUUID when available). */
function generateRequestId(): RequestId {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID() as RequestId;
  }
  return `${String(Date.now())}-${Math.random().toString(36).slice(2, 10)}` as RequestId;
}

/** Sleep with jitter for retry backoff. */
function sleepWithJitter(baseMs: number, attempt: number): Promise<void> {
  const jitter = Math.random() * baseMs;
  const delay = baseMs * 2 ** attempt + jitter;
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

/** Build a URL with query parameters. */
function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/** Check if a method typically sends a body. */
function hasBody(method: HttpMethod): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH';
}

/* ─── In-flight deduplication ────────────────────────────────────────────── */

/**
 * Key for deduplicating in-flight requests. Only GET requests are deduplicated.
 */
function dedupeKey(method: HttpMethod, url: string): string | null {
  if (method !== 'GET') {
    return null;
  }
  return `${method}:${url}`;
}

const inflight = new Map<string, Promise<unknown>>();

/* ─── Core client ────────────────────────────────────────────────────────── */

export interface ApiClient {
  /** Execute a typed request against the backend. */
  request<T>(options: RequestOptions): Promise<T>;
  /** Convenience: GET request. */
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T>;
  /** Convenience: POST request. */
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T>;
  /** Convenience: PUT request. */
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T>;
  /** Convenience: PATCH request. */
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T>;
  /** Convenience: DELETE request. */
  delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T>;
}

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 30_000;
const RETRY_BASE_MS = 500;

/**
 * Creates a fully configured API client.
 *
 * The client handles:
 * - Automatic `x-request-id` headers
 * - Automatic `Authorization: Bearer <token>` headers
 * - JSON request/response bodies
 * - 204 No Content handling
 * - Structured error handling with `ApiClientError`
 * - 401 → refresh → retry-once flow
 * - Network retry with jitter for transient failures
 * - Request cancellation via AbortController
 * - In-flight GET deduplication
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  /** Perform the actual fetch with timeout, returning a Response. */
  async function doFetch(
    url: string,
    init: RequestInit,
    externalSignal: AbortSignal | undefined,
  ): Promise<Response> {
    const controller = new AbortController();
    const signal = controller.signal;

    // Link external signal to our internal controller.
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener(
          'abort',
          () => {
            controller.abort(externalSignal.reason);
          },
          { once: true },
        );
      }
    }

    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Request timed out', 'TimeoutError'));
    }, timeoutMs);

    try {
      return await fetch(url, { ...init, signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Parse a response into the expected shape. */
  async function parseResponse<T>(response: Response, requestId: RequestId): Promise<T> {
    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      throw new ApiClientError({
        code: 'parse',
        message: 'Failed to parse response body as JSON',
        status: response.status,
        requestId,
        fieldErrors: undefined,
        isRetryable: false,
        isAuthFailure: false,
        cause: undefined,
      });
    }

    // Unwrap the V2 envelope: { success: true, data: T } & T
    if (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      (body as Record<string, unknown>)['success'] === true
    ) {
      const data = (body as Record<string, unknown>)['data'];
      if (data !== undefined) {
        return data as T;
      }
    }

    // If no envelope, return raw body (for non-enveloped endpoints)
    return body as T;
  }

  /** Build an ApiClientError from a failed response. */
  async function buildError(
    response: Response,
    requestId: RequestId,
  ): Promise<ApiClientError> {
    let code = statusToErrorCode(response.status);
    let message = `Request failed with status ${String(response.status)}`;
    let details: unknown;

    try {
      const text = await response.text();
      if (text) {
        const body = JSON.parse(text) as Record<string, unknown>;
        const rawError = body['error'];

        if (rawError && typeof rawError === 'object' && !Array.isArray(rawError)) {
          const err = rawError as Record<string, unknown>;
          const errCode = err['code'];
          const errMsg = err['message'];
          code = (typeof errCode === 'string' ? errCode : code) as ReturnType<typeof statusToErrorCode>;
          message = typeof errMsg === 'string' ? errMsg : message;
          details = err['details'];
          if (typeof err['requestId'] === 'string' || typeof err['requestId'] === 'number') {
            requestId = String(err['requestId']) as RequestId;
          }
        } else if ('code' in body && 'message' in body) {
          const bodyCode = body['code'];
          const bodyMsg = body['message'];
          code = (typeof bodyCode === 'string' ? bodyCode : code) as ReturnType<typeof statusToErrorCode>;
          message = typeof bodyMsg === 'string' ? bodyMsg : message;
          details = body['details'];
        }
      }
    } catch {
      // Ignore parse errors — use defaults
    }

    const fieldErrors = parseFieldErrors(details);
    const retryable = isRetryableError(response.status, code);
    const authFailure = isAuthFailure(response.status);

    return new ApiClientError({
      code,
      message,
      status: response.status,
      requestId,
      fieldErrors,
      isRetryable: retryable,
      isAuthFailure: authFailure,
      cause: undefined,
    });
  }

  /** Core request function — handles auth, retry, dedup, cancellation. */
  async function doRequest<T>(
    options: RequestOptions,
    retryCount = 0,
    authRetried = false,
  ): Promise<T> {
    const { method, path, body, headers: customHeaders, query, signal } = options;

    // Build URL
    const url = buildUrl(config.baseUrl, path, query);

    // Request ID for this attempt
    const requestId = generateRequestId();

    // Get access token
    const token = await config.getAccessToken();

    // Build headers
    const requestHeaders: Record<string, string> = {
      'x-request-id': requestId,
      ...customHeaders,
    };
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    if (hasBody(method) && body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    // Build init
    const init: RequestInit = {
      method,
      headers: requestHeaders,
      body: hasBody(method) && body !== undefined ? JSON.stringify(body) : null,
    };

    // Deduplication for GET requests (only for initial calls, not retries)
    const key = dedupeKey(method, url);
    if (key && retryCount === 0 && !authRetried && inflight.has(key)) {
      return inflight.get(key) as Promise<T>;
    }

    const promise = executeRequest<T>(url, init, signal, requestId, options, retryCount, authRetried);

    if (key && retryCount === 0 && !authRetried) {
      inflight.set(key, promise);
      promise.then(
        () => { inflight.delete(key); },
        () => { inflight.delete(key); },
      );
    }

    return promise;
  }

  async function executeRequest<T>(
    url: string,
    init: RequestInit,
    signal: AbortSignal | undefined,
    requestId: RequestId,
    options: RequestOptions,
    retryCount: number,
    authRetried: boolean,
  ): Promise<T> {
    try {
      const response = await doFetch(url, init, signal);

      if (response.ok) {
        return await parseResponse<T>(response, requestId);
      }

      // 401 → try refresh + retry once
      if (response.status === 401 && !authRetried && !options.skipAuthRetry) {
        await response.text().catch(() => undefined);

        try {
          await config.getAccessToken();
        } catch {
          // Refresh failed — fall through to error
        }

        return await doRequest<T>(options, retryCount, true);
      }

      // 401 after auth retry (or skipAuthRetry) — session is dead
      if (response.status === 401) {
        config.onUnauthorized();
      }

      const error = await buildError(response, requestId);

      if (error.isRetryable && !options.skipRetry && retryCount < DEFAULT_MAX_RETRIES) {
        await sleepWithJitter(RETRY_BASE_MS, retryCount);
        return await doRequest<T>(options, retryCount + 1, authRetried);
      }

      throw error;
    } catch (err) {
      if (err instanceof ApiClientError) {
        throw err;
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError({
          code: 'aborted',
          message: 'Request was aborted',
          status: undefined,
          requestId,
          fieldErrors: undefined,
          isRetryable: false,
          isAuthFailure: false,
          cause: err,
        });
      }

      if (err instanceof DOMException && err.name === 'TimeoutError') {
        if (!options.skipRetry && retryCount < DEFAULT_MAX_RETRIES) {
          await sleepWithJitter(RETRY_BASE_MS, retryCount);
          return await doRequest<T>(options, retryCount + 1, authRetried);
        }
        throw new ApiClientError({
          code: 'timeout',
          message: 'Request timed out',
          status: undefined,
          requestId,
          fieldErrors: undefined,
          isRetryable: true,
          isAuthFailure: false,
          cause: err,
        });
      }

      if (err instanceof TypeError) {
        if (!options.skipRetry && retryCount < DEFAULT_MAX_RETRIES) {
          await sleepWithJitter(RETRY_BASE_MS, retryCount);
          return await doRequest<T>(options, retryCount + 1, authRetried);
        }
        throw new ApiClientError({
          code: 'network',
          message: err.message || 'Network error',
          status: undefined,
          requestId,
          fieldErrors: undefined,
          isRetryable: true,
          isAuthFailure: false,
          cause: err,
        });
      }

      throw new ApiClientError({
        code: 'unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        status: undefined,
        requestId,
        fieldErrors: undefined,
        isRetryable: false,
        isAuthFailure: false,
        cause: err,
      });
    }
  }

  function get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return doRequest<T>({ method: 'GET', path, ...options });
  }

  function post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T> {
    return doRequest<T>({ method: 'POST', path, body, ...options });
  }

  function put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T> {
    return doRequest<T>({ method: 'PUT', path, body, ...options });
  }

  function patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T> {
    return doRequest<T>({ method: 'PATCH', path, body, ...options });
  }

  function delete_<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return doRequest<T>({ method: 'DELETE', path, ...options });
  }

  return {
    request: doRequest,
    get,
    post,
    put,
    patch,
    delete: delete_,
  };
}

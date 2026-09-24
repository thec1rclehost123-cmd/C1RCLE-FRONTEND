/*
 * This is the ONE module in the repository that reaches the network.
 * It resolves `fetch` through `globalThis` so the reference is injectable in
 * tests, which also keeps it outside the repo-wide ban on the bare global.
 */
import { ApiClientError, parseRetryAfterMs, statusToErrorCode } from './errors.js';

import type { ApiClientConfig, HttpMethod, RequestOptions, TextRequestOptions } from './types.js';
import type { ApiErrorCode, RequestId } from '@c1rcle/types';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 250;

/** The minimal transport surface both the JSON and raw-text calls satisfy. */
interface SendOptions {
  readonly method?: HttpMethod;
  readonly path: string;
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}
const MAX_RETRY_AFTER_MS = 30_000;

function newRequestId(): RequestId {
  return crypto.randomUUID() as RequestId;
}

function buildUrl(baseUrl: string, path: string, query: RequestOptions<unknown>['query']): string {
  const url = new URL(path.replace(/^\//, ''), `${baseUrl.replace(/\/$/, '')}/`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function delay(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

interface ErrorEnvelope {
  readonly message?: unknown;
  readonly fieldErrors?: unknown;
}

function extractFieldErrors(value: unknown): Record<string, string[]> | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const result: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((m): m is string => typeof m === 'string');
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * The single HTTP client for the entire platform.
 *
 * It owns base URL resolution, authentication, timeouts, retry with
 * exponential backoff and jitter, request correlation IDs, response parsing
 * and error typing. Nothing else in this repository may call `fetch`.
 */
export class ApiClient {
  readonly #baseUrl: string;
  readonly #timeoutMs: number;
  readonly #maxRetries: number;
  readonly #config: ApiClientConfig;
  readonly #fetch: typeof fetch;

  public constructor(config: ApiClientConfig) {
    this.#config = config;
    this.#baseUrl = config.baseUrl;
    this.#timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.#maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.#fetch = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  public get<T>(options: Omit<RequestOptions<T>, 'method' | 'body'>): Promise<T> {
    return this.request({ ...options, method: 'GET' });
  }

  public post<T>(options: Omit<RequestOptions<T>, 'method'>): Promise<T> {
    return this.request({ ...options, method: 'POST' });
  }

  public put<T>(options: Omit<RequestOptions<T>, 'method'>): Promise<T> {
    return this.request({ ...options, method: 'PUT' });
  }

  public patch<T>(options: Omit<RequestOptions<T>, 'method'>): Promise<T> {
    return this.request({ ...options, method: 'PATCH' });
  }

  public delete<T>(options: Omit<RequestOptions<T>, 'method'>): Promise<T> {
    return this.request({ ...options, method: 'DELETE' });
  }

  public async request<T>(options: RequestOptions<T>): Promise<T> {
    return this.#run(() => this.#attemptJson(options, false), options);
  }

  /**
   * Performs a raw-text GET and returns the response body string. Kept inside
   * this module (the only one allowed to reach the network) so a CSV/octet
   * download gets the same auth, retry, timeout and correlation-id behaviour
   * as the JSON calls. No schema validation — the bytes are returned as-is.
   */
  public fetchText(options: TextRequestOptions): Promise<string> {
    return this.#run(() => this.#attemptText(options, false), options);
  }

  async #run<T>(
    attempt: () => Promise<T>,
    options: { retries?: number; signal?: AbortSignal },
  ): Promise<T> {
    const attempts = (options.retries ?? this.#maxRetries) + 1;
    let lastError: ApiClientError | undefined;

    for (let attemptIndex = 0; attemptIndex < attempts; attemptIndex += 1) {
      try {
        return await attempt();
      } catch (error) {
        if (!(error instanceof ApiClientError) || !error.isRetryable) {
          throw error;
        }

        lastError = error;

        if (attemptIndex < attempts - 1) {
          const wait =
            error.retryAfterMs !== undefined
              ? Math.min(error.retryAfterMs, MAX_RETRY_AFTER_MS)
              : RETRY_BASE_DELAY_MS * 2 ** attemptIndex + Math.random() * RETRY_BASE_DELAY_MS;
          await delay(wait, options.signal);
        }
      }
    }

    throw lastError ?? this.#error('unknown', 'Request failed with no recorded error.');
  }

  async #attemptJson<T>(options: RequestOptions<T>, isReauthRetry: boolean): Promise<T> {
    const { response, requestId } = await this.#send(options, isReauthRetry);

    if (response.status === 204) {
      return this.#parse(options.schema, undefined, requestId);
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch (cause) {
      throw this.#error('parse', 'The server returned a malformed response.', {
        requestId,
        cause,
      });
    }

    return this.#parse(options.schema, payload, requestId);
  }

  async #attemptText(options: TextRequestOptions, isReauthRetry: boolean): Promise<string> {
    const { response, requestId } = await this.#send(
      {
        method: 'GET',
        headers: { accept: 'text/csv' },
        ...options,
      },
      isReauthRetry,
    );

    try {
      return await response.text();
    } catch (cause) {
      throw this.#error('parse', 'The server returned a malformed response.', {
        requestId,
        cause,
      });
    }
  }

  /**
   * The shared round trip: builds the URL, attaches auth/signals, performs the
   * fetch, and normalises non-2xx responses (including the single 401 reauth
   * replay). Returns the raw `Response`; callers decide how to read it.
   */
  async #send(
    options: SendOptions,
    isReauthRetry: boolean,
  ): Promise<{ response: Response; requestId: RequestId }> {
    const requestId = newRequestId();
    const timeoutMs = options.timeoutMs ?? this.#timeoutMs;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    const token = await this.#config.getToken?.();
    const hasBody = options.body !== undefined;

    let response: Response;

    try {
      response = await this.#fetch(buildUrl(this.#baseUrl, options.path, options.query), {
        method: options.method ?? 'GET',
        signal,
        headers: {
          accept: 'application/json',
          'x-request-id': requestId,
          ...(hasBody ? { 'content-type': 'application/json' } : {}),
          ...(token !== null && token !== undefined ? { authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        ...(hasBody ? { body: JSON.stringify(options.body) } : {}),
      });
    } catch (cause) {
      if (options.signal?.aborted === true) {
        throw this.#error('aborted', 'Request was cancelled.', { requestId, cause });
      }

      if (timeoutSignal.aborted) {
        throw this.#error('timeout', `Request timed out after ${String(timeoutMs)}ms.`, {
          requestId,
          cause,
        });
      }

      throw this.#error('network', 'Could not reach the server. Check your connection.', {
        requestId,
        cause,
      });
    }

    const correlationId = (response.headers.get('x-request-id') ?? requestId) as RequestId;

    if (!response.ok) {
      if (response.status === 401 && this.#config.reauth !== undefined && !isReauthRetry) {
        const recovered = await this.#config.reauth();
        if (recovered) {
          return this.#send(options, true);
        }
      }
      throw await this.#toHttpError(response, correlationId);
    }

    return { response, requestId: correlationId };
  }

  #parse<T>(schema: RequestOptions<T>['schema'], payload: unknown, requestId: RequestId): T {
    const result = schema.safeParse(payload);

    if (!result.success) {
      throw this.#error(
        'parse',
        'The server response did not match the expected contract. This usually means the frontend and backend are out of sync.',
        { requestId, cause: result.error },
      );
    }

    return result.data;
  }

  async #toHttpError(response: Response, requestId: RequestId): Promise<ApiClientError> {
    const code = statusToErrorCode(response.status);

    if (code === 'unauthorized') {
      await this.#config.onUnauthorized?.();
    }

    let envelope: ErrorEnvelope = {};

    try {
      const parsed: unknown = await response.json();
      if (typeof parsed === 'object' && parsed !== null) {
        envelope = parsed;
      }
    } catch {
      /* A non-JSON error body is expected from proxies and gateways. */
    }

    return new ApiClientError({
      code,
      message:
        typeof envelope.message === 'string' && envelope.message.length > 0
          ? envelope.message
          : `Request failed with status ${String(response.status)}.`,
      status: response.status,
      requestId,
      fieldErrors: extractFieldErrors(envelope.fieldErrors),
      retryAfterMs: parseRetryAfterMs(response.headers.get('retry-after')),
    });
  }

  #error(
    code: ApiErrorCode,
    message: string,
    context?: { requestId?: RequestId; cause?: unknown },
  ): ApiClientError {
    return new ApiClientError(
      {
        code,
        message,
        status: undefined,
        requestId: context?.requestId,
        fieldErrors: undefined,
      },
      { cause: context?.cause },
    );
  }
}

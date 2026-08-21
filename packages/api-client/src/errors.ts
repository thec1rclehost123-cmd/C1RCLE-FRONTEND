import type { ApiErrorCode, RequestId } from '@c1rcle/types';

/* ─── Error code mapping (must match packages/contracts/src/index.ts) ────── */

/**
 * Locked status → code table.
 * 4xx outside this set collapses to 'unknown'; 5xx to 'server'.
 */
const STATUS_CODE_TO_ERROR_CODE: Readonly<Partial<Record<number, ApiErrorCode>>> = {
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation',
  429: 'rate_limited',
};

/** Maps an HTTP status code to the frontend's canonical error code. */
export function statusToErrorCode(status: number): ApiErrorCode {
  const mapped = STATUS_CODE_TO_ERROR_CODE[status];
  if (mapped) return mapped;
  return status >= 500 ? 'server' : 'unknown';
}

/* ─── ApiClientError ─────────────────────────────────────────────────────── */

export interface ApiClientErrorOptions {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly status: number | undefined;
  readonly requestId: RequestId | undefined;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>> | undefined;
  readonly isRetryable: boolean;
  readonly isAuthFailure: boolean;
  readonly cause: unknown;
}

/**
 * Structured error thrown by `@c1rcle/api-client` for every failed request.
 *
 * Consumers should use `isApiClientError()` to detect these; the `.code`
 * property drives UI-level error mapping.
 */
export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | undefined;
  readonly requestId: RequestId | undefined;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>> | undefined;
  readonly isRetryable: boolean;
  readonly isAuthFailure: boolean;

  constructor(options: ApiClientErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'ApiClientError';
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.fieldErrors = options.fieldErrors;
    this.isRetryable = options.isRetryable;
    this.isAuthFailure = options.isAuthFailure;
  }
}

/** Type guard — returns `true` when `error` is an `ApiClientError`. */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

/* ─── Field errors helper ────────────────────────────────────────────────── */

/**
 * Parse a V2 error body's `details` array into the canonical
 * `Record<string, string[]>` shape used by `ApiClientError`.
 */
export function parseFieldErrors(
  details: unknown,
): Readonly<Record<string, readonly string[]>> | undefined {
  if (!Array.isArray(details) || details.length === 0) {
    return undefined;
  }

  const fieldErrors: Record<string, string[]> = {};

  for (const item of details) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'path' in item &&
      'message' in item
    ) {
      const path = String((item as Record<string, unknown>)['path']) || '_root';
      const message = String((item as Record<string, unknown>)['message']);
      const existing = fieldErrors[path];
      if (existing) {
        existing.push(message);
      } else {
        fieldErrors[path] = [message];
      }
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

/* ─── Retry classification ──────────────────────────────────────────────── */

/** HTTP status codes that are safe to retry (idempotent or transient). */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/** Determine whether a failed request is safe to retry. */
export function isRetryableError(status: number | undefined, code: ApiErrorCode): boolean {
  if (status !== undefined && RETRYABLE_STATUSES.has(status)) {
    return true;
  }
  return code === 'network' || code === 'timeout';
}

/** Determine whether a failure indicates the session is invalid. */
export function isAuthFailure(status: number | undefined): boolean {
  return status === 401;
}

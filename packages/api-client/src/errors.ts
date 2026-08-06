import type { ApiError, ApiErrorCode, RequestId } from '@c1rcle/types';

/**
 * The only error type that ever escapes this package.
 *
 * Callers never see a raw `TypeError: Failed to fetch`, a `SyntaxError` from
 * JSON parsing, or a bare status code — they see a discriminated `code` they
 * can switch on exhaustively.
 */
export class ApiClientError extends Error implements ApiError {
  public readonly code: ApiErrorCode;
  public readonly status: number | undefined;
  public readonly requestId: RequestId | undefined;
  public readonly fieldErrors: Readonly<Record<string, readonly string[]>> | undefined;

  public constructor(init: ApiError, options?: { cause?: unknown }) {
    super(init.message, options);
    this.name = 'ApiClientError';
    this.code = init.code;
    this.status = init.status;
    this.requestId = init.requestId;
    this.fieldErrors = init.fieldErrors;
  }

  /** True when retrying the same request could plausibly succeed. */
  public get isRetryable(): boolean {
    if (this.code === 'network' || this.code === 'timeout' || this.code === 'rate_limited') {
      return true;
    }

    return this.code === 'server' && this.status !== 501;
  }

  /** True when the user needs to re-authenticate. */
  public get isAuthFailure(): boolean {
    return this.code === 'unauthorized';
  }
}

export function statusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
    case 422:
      return 'validation';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 429:
      return 'rate_limited';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

export function isApiClientError(value: unknown): value is ApiClientError {
  return value instanceof ApiClientError;
}

import { describe, expect, it } from 'vitest';

import {
  ApiClientError,
  isApiClientError,
  isAuthFailure,
  isRetryableError,
  parseFieldErrors,
  statusToErrorCode,
} from './errors.js';

/* ─── statusToErrorCode ─────────────────────────────────────────────────── */

describe('statusToErrorCode', () => {
  it('maps 400 to validation', () => {
    expect(statusToErrorCode(400)).toBe('validation');
  });

  it('maps 401 to unauthorized', () => {
    expect(statusToErrorCode(401)).toBe('unauthorized');
  });

  it('maps 403 to forbidden', () => {
    expect(statusToErrorCode(403)).toBe('forbidden');
  });

  it('maps 404 to not_found', () => {
    expect(statusToErrorCode(404)).toBe('not_found');
  });

  it('maps 409 to conflict', () => {
    expect(statusToErrorCode(409)).toBe('conflict');
  });

  it('maps 422 to validation', () => {
    expect(statusToErrorCode(422)).toBe('validation');
  });

  it('maps 429 to rate_limited', () => {
    expect(statusToErrorCode(429)).toBe('rate_limited');
  });

  it('maps 500 to server', () => {
    expect(statusToErrorCode(500)).toBe('server');
  });

  it('maps 502 to server', () => {
    expect(statusToErrorCode(502)).toBe('server');
  });

  it('maps 503 to server', () => {
    expect(statusToErrorCode(503)).toBe('server');
  });

  it('maps 418 to unknown (unmapped 4xx)', () => {
    expect(statusToErrorCode(418)).toBe('unknown');
  });

  it('maps 410 to unknown (unmapped 4xx)', () => {
    expect(statusToErrorCode(410)).toBe('unknown');
  });

  it('maps 200 to unknown (non-error)', () => {
    expect(statusToErrorCode(200)).toBe('unknown');
  });
});

/* ─── ApiClientError ────────────────────────────────────────────────────── */

describe('ApiClientError', () => {
  it('creates an error with all properties', () => {
    const error = new ApiClientError({
      code: 'validation',
      message: 'Invalid input',
      status: 400,
      requestId: 'req-123' as never,
      fieldErrors: { email: ['is required'] },
      isRetryable: false,
      isAuthFailure: false,
      cause: undefined,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.name).toBe('ApiClientError');
    expect(error.code).toBe('validation');
    expect(error.message).toBe('Invalid input');
    expect(error.status).toBe(400);
    expect(error.requestId).toBe('req-123');
    expect(error.fieldErrors).toEqual({ email: ['is required'] });
    expect(error.isRetryable).toBe(false);
    expect(error.isAuthFailure).toBe(false);
  });

  it('creates an error with optional fields undefined', () => {
    const error = new ApiClientError({
      code: 'network',
      message: 'Connection failed',
      status: undefined,
      requestId: undefined,
      fieldErrors: undefined,
      isRetryable: true,
      isAuthFailure: false,
      cause: undefined,
    });

    expect(error.status).toBeUndefined();
    expect(error.requestId).toBeUndefined();
    expect(error.fieldErrors).toBeUndefined();
    expect(error.isRetryable).toBe(true);
  });

  it('preserves cause', () => {
    const cause = new Error('original');
    const error = new ApiClientError({
      code: 'unknown',
      message: 'wrapped',
      status: undefined,
      requestId: undefined,
      fieldErrors: undefined,
      isRetryable: false,
      isAuthFailure: false,
      cause,
    });

    expect(error.cause).toBe(cause);
  });
});

/* ─── isApiClientError ──────────────────────────────────────────────────── */

describe('isApiClientError', () => {
  it('returns true for ApiClientError', () => {
    const error = new ApiClientError({
      code: 'server',
      message: 'boom',
      status: 500,
      requestId: undefined,
      fieldErrors: undefined,
      isRetryable: true,
      isAuthFailure: false,
      cause: undefined,
    });
    expect(isApiClientError(error)).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isApiClientError(new Error('test'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isApiClientError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isApiClientError(undefined)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isApiClientError('error')).toBe(false);
  });

  it('narrows the type correctly', () => {
    const error: unknown = new ApiClientError({
      code: 'unauthorized',
      message: 'no access',
      status: 401,
      requestId: undefined,
      fieldErrors: undefined,
      isRetryable: false,
      isAuthFailure: true,
      cause: undefined,
    });
    if (isApiClientError(error)) {
      expect(error.code).toBe('unauthorized');
      expect(error.isAuthFailure).toBe(true);
    }
  });
});

/* ─── parseFieldErrors ──────────────────────────────────────────────────── */

describe('parseFieldErrors', () => {
  it('returns undefined for non-array input', () => {
    expect(parseFieldErrors(undefined)).toBeUndefined();
    expect(parseFieldErrors(null)).toBeUndefined();
    expect(parseFieldErrors('string')).toBeUndefined();
    expect(parseFieldErrors(42)).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(parseFieldErrors([])).toBeUndefined();
  });

  it('parses valid field errors', () => {
    const details = [
      { path: 'email', message: 'is required' },
      { path: 'email', message: 'must be valid' },
      { path: 'password', message: 'too short' },
    ];
    const result = parseFieldErrors(details);
    expect(result).toEqual({
      email: ['is required', 'must be valid'],
      password: ['too short'],
    });
  });

  it('uses _root for empty path', () => {
    const details = [{ path: '', message: 'something wrong' }];
    const result = parseFieldErrors(details);
    expect(result).toEqual({ _root: ['something wrong'] });
  });

  it('skips items without path or message', () => {
    const details = [
      { path: 'name', message: 'ok' },
      { foo: 'bar' },
      { path: 'x', message: 'y' },
    ];
    const result = parseFieldErrors(details);
    expect(result).toEqual({ name: ['ok'], x: ['y'] });
  });
});

/* ─── isRetryableError ──────────────────────────────────────────────────── */

describe('isRetryableError', () => {
  it('returns true for 408 Request Timeout', () => {
    expect(isRetryableError(408, 'timeout')).toBe(true);
  });

  it('returns true for 429 Rate Limited', () => {
    expect(isRetryableError(429, 'rate_limited')).toBe(true);
  });

  it('returns true for 500 Server Error', () => {
    expect(isRetryableError(500, 'server')).toBe(true);
  });

  it('returns true for 502 Bad Gateway', () => {
    expect(isRetryableError(502, 'server')).toBe(true);
  });

  it('returns true for 503 Service Unavailable', () => {
    expect(isRetryableError(503, 'server')).toBe(true);
  });

  it('returns true for 504 Gateway Timeout', () => {
    expect(isRetryableError(504, 'server')).toBe(true);
  });

  it('returns true for network error code regardless of status', () => {
    expect(isRetryableError(undefined, 'network')).toBe(true);
  });

  it('returns true for timeout error code regardless of status', () => {
    expect(isRetryableError(undefined, 'timeout')).toBe(true);
  });

  it('returns false for 400 validation', () => {
    expect(isRetryableError(400, 'validation')).toBe(false);
  });

  it('returns false for 403 forbidden', () => {
    expect(isRetryableError(403, 'forbidden')).toBe(false);
  });

  it('returns false for 404 not_found', () => {
    expect(isRetryableError(404, 'not_found')).toBe(false);
  });

  it('returns false for 409 conflict', () => {
    expect(isRetryableError(409, 'conflict')).toBe(false);
  });
});

/* ─── isAuthFailure ─────────────────────────────────────────────────────── */

describe('isAuthFailure', () => {
  it('returns true for 401', () => {
    expect(isAuthFailure(401)).toBe(true);
  });

  it('returns false for 400', () => {
    expect(isAuthFailure(400)).toBe(false);
  });

  it('returns false for 403', () => {
    expect(isAuthFailure(403)).toBe(false);
  });

  it('returns false for 500', () => {
    expect(isAuthFailure(500)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAuthFailure(undefined)).toBe(false);
  });
});

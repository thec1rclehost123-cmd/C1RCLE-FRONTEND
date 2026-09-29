import { describe, expect, it } from 'vitest';

import {
  ApiClientError,
  isApiClientError,
  parseRetryAfterMs,
  statusToErrorCode,
} from './errors.js';

import type { ApiErrorCode, RequestId } from '@c1rcle/types';

function error(
  code: ApiErrorCode,
  init: Partial<{ status: number; retryAfterMs?: number }> = {},
): ApiClientError {
  return new ApiClientError(
    {
      code,
      message: 'boom',
      status: init.status,
      requestId: 'req_1' as RequestId,
      fieldErrors: undefined,
      ...(init.retryAfterMs !== undefined ? { retryAfterMs: init.retryAfterMs } : {}),
    },
    { cause: new Error('underlying') },
  );
}

describe('ApiClientError', () => {
  it('flags unauthorized as an auth failure', () => {
    expect(error('unauthorized', { status: 401 }).isAuthFailure).toBe(true);
  });

  it('does not flag other codes as auth failures', () => {
    expect(error('forbidden', { status: 403 }).isAuthFailure).toBe(false);
    expect(error('network').isAuthFailure).toBe(false);
  });

  it('marks network/timeout/rate-limited/server as retryable', () => {
    expect(error('network').isRetryable).toBe(true);
    expect(error('timeout').isRetryable).toBe(true);
    expect(error('rate_limited', { status: 429 }).isRetryable).toBe(true);
    expect(error('server', { status: 503 }).isRetryable).toBe(true);
  });

  it('does not retry a 501 or non-retryable codes', () => {
    expect(error('server', { status: 501 }).isRetryable).toBe(false);
    expect(error('forbidden', { status: 403 }).isRetryable).toBe(false);
    expect(error('unauthorized', { status: 401 }).isRetryable).toBe(false);
  });

  it('exposes the retry-after delay in milliseconds', () => {
    expect(error('rate_limited', { status: 429, retryAfterMs: 5_000 }).retryAfterMs).toBe(5_000);
  });
});

describe('parseRetryAfterMs', () => {
  it('parses a delta-seconds value', () => {
    expect(parseRetryAfterMs('60')).toBe(60_000);
    expect(parseRetryAfterMs('0')).toBe(0);
  });

  it('parses an HTTP-date, clamping negatives to zero', () => {
    const future = new Date(Date.now() + 5_000).toUTCString();
    const futureMs = parseRetryAfterMs(future);
    expect(futureMs).toBeGreaterThan(0);

    const past = new Date(Date.now() - 5_000).toUTCString();
    expect(parseRetryAfterMs(past)).toBe(0);
  });

  it('returns undefined for null, empty or unparseable values', () => {
    expect(parseRetryAfterMs(null)).toBeUndefined();
    expect(parseRetryAfterMs('')).toBeUndefined();
    expect(parseRetryAfterMs('-5')).toBeUndefined();
    expect(parseRetryAfterMs('not-a-date')).toBeUndefined();
  });
});

describe('statusToErrorCode', () => {
  it('maps 409 to conflict', () => {
    expect(statusToErrorCode(409)).toBe('conflict');
  });

  it('maps 429 to rate_limited and 5xx to server', () => {
    expect(statusToErrorCode(429)).toBe('rate_limited');
    expect(statusToErrorCode(500)).toBe('server');
    expect(statusToErrorCode(599)).toBe('server');
  });
});

describe('isApiClientError', () => {
  it('returns true only for ApiClientError instances', () => {
    expect(isApiClientError(error('network'))).toBe(true);
    expect(isApiClientError(new Error('plain error'))).toBe(false);
    expect(isApiClientError({ code: 'network', message: 'x' })).toBe(false);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from './client.js';
import { ApiClientError } from './errors.js';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

function mockFetch(fn: (...args: unknown[]) => Response | Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(fn));
}

function createTestClient(overrides?: { getAccessToken?: () => string | null; onUnauthorized?: () => void; timeoutMs?: number }) {
  return createApiClient({
    baseUrl: 'https://api.test.com/v2',
    getAccessToken: overrides?.getAccessToken ?? (() => 'test-token'),
    onUnauthorized: overrides?.onUnauthorized ?? vi.fn(),
    timeoutMs: overrides?.timeoutMs ?? 200,
  });
}

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe('createApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('basic request handling', () => {
    it('sends GET request with correct headers', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const req = init as RequestInit;
        expect(req.method).toBe('GET');
        const headers = req.headers as Record<string, string>;
        expect(headers['x-request-id']).toBeDefined();
        expect(headers['Authorization']).toBe('Bearer test-token');
        return jsonResponse({ success: true, data: { id: '1' }, id: '1' });
      });

      const client = createTestClient();
      const result = await client.get<{ id: string }>('/users/1');
      expect(result).toEqual({ id: '1' });
    });

    it('sends POST request with JSON body', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const req = init as RequestInit;
        expect(req.method).toBe('POST');
        const headers = req.headers as Record<string, string>;
        expect(headers['Content-Type']).toBe('application/json');
        expect(req.body).toBe(JSON.stringify({ name: 'test' }));
        return jsonResponse({ success: true, data: { id: '2' }, id: '2' });
      });

      const client = createTestClient();
      const result = await client.post<{ id: string }>('/users', { name: 'test' });
      expect(result).toEqual({ id: '2' });
    });

    it('sends PUT request with body', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const req = init as RequestInit;
        expect(req.method).toBe('PUT');
        expect(req.body).toBe(JSON.stringify({ name: 'updated' }));
        return jsonResponse({ success: true, data: { ok: true }, ok: true });
      });

      const client = createTestClient();
      await client.put('/users/1', { name: 'updated' });
    });

    it('sends PATCH request with body', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const req = init as RequestInit;
        expect(req.method).toBe('PATCH');
        expect(req.body).toBe(JSON.stringify({ name: 'patched' }));
        return jsonResponse({ success: true, data: { ok: true }, ok: true });
      });

      const client = createTestClient();
      await client.patch('/users/1', { name: 'patched' });
    });

    it('sends DELETE request', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const req = init as RequestInit;
        expect(req.method).toBe('DELETE');
        return noContentResponse();
      });

      const client = createTestClient();
      await client.delete('/users/1');
    });
  });

  describe('authentication', () => {
    it('includes Authorization header when token is available', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const headers = (init as RequestInit).headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer my-token');
        return jsonResponse({ success: true, data: 'ok' });
      });

      const client = createTestClient({ getAccessToken: () => 'my-token' });
      await client.get('/test');
    });

    it('omits Authorization header when token is null', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const headers = (init as RequestInit).headers as Record<string, string>;
        expect(headers['Authorization']).toBeUndefined();
        return jsonResponse({ success: true, data: 'ok' });
      });

      const client = createTestClient({ getAccessToken: () => null });
      await client.get('/test');
    });
  });

  describe('response handling', () => {
    it('unwraps V2 envelope', async () => {
      mockFetch(() => jsonResponse({ success: true, data: { id: '1' }, id: '1' }));

      const client = createTestClient();
      const result = await client.get<{ id: string }>('/test');
      expect(result).toEqual({ id: '1' });
    });

    it('handles 204 No Content', async () => {
      mockFetch(() => noContentResponse());

      const client = createTestClient();
      const result = await client.delete('/test');
      expect(result).toBeUndefined();
    });

    it('handles empty body', async () => {
      mockFetch(() => new Response('', { status: 200 }));

      const client = createTestClient();
      const result = await client.get('/test');
      expect(result).toBeUndefined();
    });

    it('passes through non-enveloped responses', async () => {
      mockFetch(() => jsonResponse({ id: '1', name: 'test' }));

      const client = createTestClient();
      const result = await client.get<{ id: string; name: string }>('/test');
      expect(result).toEqual({ id: '1', name: 'test' });
    });

    it('sends x-request-id on every request', async () => {
      let capturedRequestId: string | undefined;
      mockFetch((_url: unknown, init: unknown) => {
        const headers = (init as RequestInit).headers as Record<string, string>;
        capturedRequestId = headers['x-request-id'];
        return jsonResponse({ success: true, data: 'ok' });
      });

      const client = createTestClient();
      await client.get('/test');
      expect(capturedRequestId).toBeDefined();
      expect(typeof capturedRequestId).toBe('string');
      expect(capturedRequestId!.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('throws ApiClientError for 4xx responses', async () => {
      mockFetch(() =>
        errorResponse(400, {
          code: 'validation',
          message: 'Invalid input',
          details: [{ path: 'email', message: 'is required' }],
        }),
      );

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toThrow(ApiClientError);
    });

    it('parses error details into fieldErrors', async () => {
      mockFetch(() =>
        errorResponse(422, {
          code: 'validation',
          message: 'Validation failed',
          details: [
            { path: 'name', message: 'required' },
            { path: 'email', message: 'invalid' },
          ],
        }),
      );

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toMatchObject({
        code: 'validation',
        status: 422,
        fieldErrors: {
          name: ['required'],
          email: ['invalid'],
        },
      });
    });

    it('handles server errors (5xx)', async () => {
      mockFetch(() => errorResponse(500, { message: 'Internal error' }));

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toMatchObject({
        code: 'server',
        status: 500,
      });
    });

    it('handles rate limiting (429)', async () => {
      mockFetch(() => errorResponse(429, { message: 'Too many requests' }));

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toMatchObject({
        code: 'rate_limited',
        status: 429,
      });
    });
  });

  describe('401 auth retry', () => {
    it('retries once after 401 by refreshing token', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount === 1) {
          return errorResponse(401, { message: 'Unauthorized' });
        }
        return jsonResponse({ success: true, data: 'recovered', recovered: true });
      });

      const client = createTestClient();
      const result = await client.get('/test', { skipRetry: true });
      expect(result).toBe('recovered');
      expect(callCount).toBe(2);
    });

    it('does not retry twice on 401', async () => {
      mockFetch(() => errorResponse(401, { message: 'Unauthorized' }));

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toMatchObject({
        code: 'unauthorized',
      });
    });

    it('does not retry 401 when skipAuthRetry is set', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return errorResponse(401, { message: 'Unauthorized' });
      });

      const client = createTestClient();
      await expect(client.get('/test', { skipAuthRetry: true, skipRetry: true })).rejects.toThrow(ApiClientError);
      expect(callCount).toBe(1);
    });

    it('calls onUnauthorized when 401 retry also fails', async () => {
      mockFetch(() => errorResponse(401, { message: 'Unauthorized' }));

      const onUnauthorized = vi.fn();
      const client = createTestClient({ onUnauthorized });
      await expect(client.get('/test', { skipRetry: true })).rejects.toMatchObject({
        code: 'unauthorized',
      });
      expect(onUnauthorized).toHaveBeenCalledOnce();
    });

    it('calls onUnauthorized when skipAuthRetry is set on 401', async () => {
      mockFetch(() => errorResponse(401, { message: 'Unauthorized' }));

      const onUnauthorized = vi.fn();
      const client = createTestClient({ onUnauthorized });
      await expect(client.get('/test', { skipAuthRetry: true, skipRetry: true })).rejects.toMatchObject({
        code: 'unauthorized',
      });
      expect(onUnauthorized).toHaveBeenCalledOnce();
    });

    it('calls refreshSession on 401 and retries with the new token', async () => {
      let callCount = 0;
      const seenTokens: (string | undefined)[] = [];
      mockFetch((_url: unknown, init: unknown) => {
        callCount++;
        const headers = (init as RequestInit).headers as Record<string, string>;
        seenTokens.push(headers['Authorization']);
        if (callCount === 1) {
          return errorResponse(401, { message: 'Token expired' });
        }
        return jsonResponse({ success: true, data: 'recovered' });
      });

      const refreshSession = vi.fn().mockReturnValue('fresh-token');
      const client = createApiClient({
        baseUrl: 'https://api.test.com/v2',
        getAccessToken: () => 'stale-token',
        refreshSession,
        onUnauthorized: vi.fn(),
        timeoutMs: 200,
      });

      const result = await client.get('/test', { skipRetry: true });
      expect(result).toBe('recovered');
      expect(refreshSession).toHaveBeenCalledOnce();
      expect(seenTokens[0]).toBe('Bearer stale-token');
      expect(seenTokens[1]).toBe('Bearer fresh-token');
    });

    it('falls back to getAccessToken when refreshSession is not provided', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount === 1) {
          return errorResponse(401, { message: 'Token expired' });
        }
        return jsonResponse({ success: true, data: 'recovered' });
      });

      const getAccessToken = vi.fn().mockReturnValue('rotated-token');
      const client = createApiClient({
        baseUrl: 'https://api.test.com/v2',
        getAccessToken,
        onUnauthorized: vi.fn(),
        timeoutMs: 200,
      });

      const result = await client.get('/test', { skipRetry: true });
      expect(result).toBe('recovered');
      // Initial request + 401 refresh fallback
      expect(getAccessToken).toHaveBeenCalledTimes(2);
    });

    it('supports async refreshSession implementations', async () => {
      let callCount = 0;
      mockFetch((_url: unknown, init: unknown) => {
        callCount++;
        const headers = (init as RequestInit).headers as Record<string, string>;
        if (callCount === 1) {
          return errorResponse(401, { message: 'Token expired' });
        }
        expect(headers['Authorization']).toBe('Bearer async-fresh-token');
        return jsonResponse({ success: true, data: 'ok' });
      });

      const client = createApiClient({
        baseUrl: 'https://api.test.com/v2',
        getAccessToken: () => 'stale-token',
        refreshSession: async () => await Promise.resolve('async-fresh-token'),
        onUnauthorized: vi.fn(),
        timeoutMs: 200,
      });

      const result = await client.get('/test', { skipRetry: true });
      expect(result).toBe('ok');
    });
  });

  describe('network retry', () => {
    it('retries on 503 server error', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        if (callCount === 1) {
          return errorResponse(503, { message: 'Service unavailable' });
        }
        return jsonResponse({ id: '1' });
      });

      const client = createTestClient();
      const result = await client.get('/test');
      expect(result).toEqual({ id: '1' });
      expect(callCount).toBe(2);
    }, 10000);

    it('does not retry on 400 validation error', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return errorResponse(400, { code: 'validation', message: 'Bad request' });
      });

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toThrow(ApiClientError);
      expect(callCount).toBe(1);
    });

    it('does not retry on 404', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return errorResponse(404, { message: 'Not found' });
      });

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toThrow(ApiClientError);
      expect(callCount).toBe(1);
    });

    it('does not retry when skipRetry is set', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return errorResponse(503, { message: 'Unavailable' });
      });

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toThrow(ApiClientError);
      expect(callCount).toBe(1);
    });
  });

  describe('request cancellation', () => {
    it('throws aborted error when signal is aborted', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const signal = (init as RequestInit).signal as AbortSignal | undefined;
        return new Promise<Response>((resolve, reject) => {
          if (signal?.aborted) {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
            return;
          }
          const timer = setTimeout(() => { resolve(new Response(null, { status: 200 })); }, 60_000);
          signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          }, { once: true });
        });
      });

      const controller = new AbortController();
      const client = createTestClient();

      const promise = client.get('/test', { signal: controller.signal });
      controller.abort();

      await expect(promise).rejects.toMatchObject({ code: 'aborted' });
    });
  });

  describe('query parameters', () => {
    it('appends query parameters to URL', async () => {
      let capturedUrl: string | undefined;
      mockFetch((url: unknown) => {
        capturedUrl = url as string;
        return jsonResponse({ success: true, data: 'ok' });
      });

      const client = createTestClient();
      await client.get('/test', { query: { page: '1', limit: '20', search: 'hello' } });
      expect(capturedUrl).toContain('page=1');
      expect(capturedUrl).toContain('limit=20');
      expect(capturedUrl).toContain('search=hello');
    });

    it('omits undefined query values', async () => {
      let capturedUrl: string | undefined;
      mockFetch((url: unknown) => {
        capturedUrl = url as string;
        return jsonResponse({ success: true, data: 'ok' });
      });

      const client = createTestClient();
      await client.get('/test', { query: { page: '1', filter: undefined } });
      expect(capturedUrl).toContain('page=1');
      expect(capturedUrl).not.toContain('filter');
    });
  });

  describe('request() generic method', () => {
    it('works with method + path options', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const req = init as RequestInit;
        expect(req.method).toBe('POST');
        return jsonResponse({ success: true, data: { created: true } });
      });

      const client = createTestClient();
      const result = await client.request<{ created: boolean }>({
        method: 'POST',
        path: '/items',
        body: { name: 'test' },
      });
      expect(result).toEqual({ created: true });
    });
  });

  describe('timeout handling', () => {
    it('retries on timeout and eventually throws', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return new Promise<Response>((_resolve, reject) => {
          setTimeout(() => {
            reject(new DOMException('The operation timed out', 'TimeoutError'));
          }, 0);
        });
      });

      const client = createTestClient({ timeoutMs: 50 });
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'timeout',
        isRetryable: true,
      });
      expect(callCount).toBeGreaterThan(1);
    }, 15000);
  });

  describe('network error handling', () => {
    it('retries on TypeError (network error) and eventually throws', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return Promise.reject(new TypeError('Failed to fetch'));
      });

      const client = createTestClient();
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'network',
        isRetryable: true,
      });
      expect(callCount).toBeGreaterThan(1);
    }, 15000);
  });

  describe('GET deduplication', () => {
    it('deduplicates concurrent identical GET requests', async () => {
      let callCount = 0;
      mockFetch(() => {
        callCount++;
        return new Promise<Response>((resolve) => {
          setTimeout(() => {
            resolve(jsonResponse({ success: true, data: 'ok' }));
          }, 50);
        });
      });

      const client = createTestClient();
      const [a, b, c] = await Promise.all([
        client.get('/test'),
        client.get('/test'),
        client.get('/test'),
      ]);
      expect(a).toBe('ok');
      expect(b).toBe('ok');
      expect(c).toBe('ok');
      expect(callCount).toBe(1);
    });
  });

  describe('V2 error envelope parsing', () => {
    it('parses error from { error: { code, message, details } } envelope', async () => {
      mockFetch(() =>
        errorResponse(422, {
          error: {
            code: 'validation',
            message: 'Invalid input',
            details: [{ path: 'name', message: 'required' }],
            requestId: 'server-req-999',
          },
        }),
      );

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toMatchObject({
        code: 'validation',
        status: 422,
        fieldErrors: { name: ['required'] },
        requestId: 'server-req-999',
      });
    });

    it('parses error from flat { code, message } body', async () => {
      mockFetch(() =>
        errorResponse(400, {
          code: 'validation',
          message: 'Bad request',
        }),
      );

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toMatchObject({
        code: 'validation',
        message: 'Bad request',
        status: 400,
      });
    });

    it('handles non-JSON error body gracefully', async () => {
      mockFetch(() =>
        new Response('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        }),
      );

      const client = createTestClient();
      await expect(client.get('/test', { skipRetry: true })).rejects.toMatchObject({
        code: 'server',
        status: 500,
      });
    });
  });

  describe('unknown error handling', () => {
    it('wraps non-Error throws as unknown ApiClientError', async () => {
      mockFetch(() => {
        throw 'string error'; // eslint-disable-line @typescript-eslint/only-throw-error
      });

      const client = createTestClient();
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'unknown',
      });
    });
  });

  describe('POST without body', () => {
    it('sends POST without Content-Type when body is undefined', async () => {
      mockFetch((_url: unknown, init: unknown) => {
        const req = init as RequestInit;
        expect(req.method).toBe('POST');
        const headers = req.headers as Record<string, string>;
        expect(headers['Content-Type']).toBeUndefined();
        expect(req.body).toBeNull();
        return jsonResponse({ success: true, data: 'ok' });
      });

      const client = createTestClient();
      await client.post('/test');
    });
  });
});

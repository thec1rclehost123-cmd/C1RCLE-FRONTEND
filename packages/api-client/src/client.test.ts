import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiClient } from './client.js';
import { ApiClientError } from './errors.js';
import { noContentSchema } from './schemas.js';

const schema = z.object({ id: z.string() });

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function clientWith(fetchImpl: typeof fetch, overrides = {}): ApiClient {
  return new ApiClient({
    baseUrl: 'https://api.c1rcle.test',
    maxRetries: 0,
    fetchImpl,
    ...overrides,
  });
}

describe('ApiClient', () => {
  it('resolves the path against the base URL and serialises query params', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ id: 'a' }));

    await clientWith(fetchImpl).get({ path: '/users', query: { page: 2, active: true }, schema });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://api.c1rcle.test/users?page=2&active=true');
  });

  it('sends a correlation id on every request', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ id: 'a' }));

    await clientWith(fetchImpl).get({ path: '/users', schema });

    const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('attaches a bearer token when one is available', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ id: 'a' }));

    await clientWith(fetchImpl, { getToken: () => 'tok_123' }).get({ path: '/me', schema });

    const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['authorization']).toBe('Bearer tok_123');
  });

  it('maps status codes to typed error codes', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ message: 'nope' }, { status: 403 }));

    await expect(clientWith(fetchImpl).get({ path: '/admin', schema })).rejects.toMatchObject({
      code: 'forbidden',
      status: 403,
      message: 'nope',
    });
  });

  it('surfaces field errors from a validation failure', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse(
          { message: 'invalid', fieldErrors: { email: ['is required'] } },
          { status: 422 },
        ),
      );

    const error = await clientWith(fetchImpl)
      .post({ path: '/users', body: {}, schema })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).fieldErrors).toEqual({ email: ['is required'] });
  });

  it('calls onUnauthorized exactly once for a 401', async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, { status: 401 }));

    await clientWith(fetchImpl, { onUnauthorized })
      .get({ path: '/me', schema })
      .catch(() => undefined);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('rejects a response that does not match its schema', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ wrong: true }));

    await expect(clientWith(fetchImpl).get({ path: '/users', schema })).rejects.toMatchObject({
      code: 'parse',
    });
  });

  it('turns a transport failure into a typed network error', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(clientWith(fetchImpl).get({ path: '/users', schema })).rejects.toMatchObject({
      code: 'network',
    });
  });

  it('retries a retryable failure and succeeds', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({}, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ id: 'a' }));

    const result = await clientWith(fetchImpl, { maxRetries: 1 }).get({ path: '/users', schema });

    expect(result).toEqual({ id: 'a' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry a client error', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, { status: 404 }));

    await clientWith(fetchImpl, { maxRetries: 3 })
      .get({ path: '/users', schema })
      .catch(() => undefined);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  describe('reauth', () => {
    it('replays the request once when reauth recovers a 401', async () => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse({}, { status: 401 }))
        .mockResolvedValueOnce(jsonResponse({ id: 'a' }));
      const reauth = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
      const onUnauthorized = vi.fn();

      const result = await clientWith(fetchImpl, { reauth, onUnauthorized }).get({
        path: '/me',
        schema,
      });

      expect(result).toEqual({ id: 'a' });
      expect(reauth).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('surfaces unauthorized and fires onUnauthorized when reauth returns false', async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, { status: 401 }));
      const reauth = vi.fn<() => Promise<boolean>>().mockResolvedValue(false);
      const onUnauthorized = vi.fn();

      await expect(
        clientWith(fetchImpl, { reauth, onUnauthorized }).get({ path: '/me', schema }),
      ).rejects.toMatchObject({ code: 'unauthorized' });

      expect(reauth).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('does not loop when the replayed request also 401s', async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, { status: 401 }));
      const reauth = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);

      await clientWith(fetchImpl, { reauth })
        .get({ path: '/me', schema })
        .catch(() => undefined);

      expect(reauth).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
  });

  it('honours Retry-After on a 429 instead of exponential backoff', async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response('{}', { status: 429, headers: { 'retry-after': '2' } }))
        .mockResolvedValueOnce(jsonResponse({ id: 'a' }));

      const promise = clientWith(fetchImpl, { maxRetries: 1 }).get({ path: '/users', schema });

      await vi.advanceTimersByTimeAsync(1_900);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(200);

      await expect(promise).resolves.toEqual({ id: 'a' });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  describe('fetchText', () => {
    it('returns the raw response body for a CSV-style GET', async () => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('adminId,action\nuser_1,PAYOUT_FREEZE', { status: 200 }));

      const body = await clientWith(fetchImpl).fetchText({ path: '/export.csv' });

      expect(body).toBe('adminId,action\nuser_1,PAYOUT_FREEZE');
    });

    it('serialises query params like the JSON calls', async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('a', { status: 200 }));

      await clientWith(fetchImpl).fetchText({ path: '/export.csv', query: { limit: 500 } });

      expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://api.c1rcle.test/export.csv?limit=500');
    });

    it('maps a non-ok response to a typed error', async () => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('nope', { status: 403 }));

      await expect(clientWith(fetchImpl).fetchText({ path: '/export.csv' })).rejects.toMatchObject({
        code: 'forbidden',
        status: 403,
      });
    });

    it('replays once when reauth recovers a 401', async () => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response('', { status: 401 }))
        .mockResolvedValueOnce(new Response('a,b\n1,2', { status: 200 }));
      const reauth = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);

      const body = await clientWith(fetchImpl, { reauth }).fetchText({ path: '/export.csv' });

      expect(body).toBe('a,b\n1,2');
      expect(reauth).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
  });

  it('supports PUT, PATCH and DELETE verbs', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: 'a' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'a' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'a' }));
    const client = clientWith(fetchImpl);

    await client.put({ path: '/users/a', body: { name: 'x' }, schema });
    await client.patch({ path: '/users/a', body: { name: 'x' }, schema });
    await client.delete({ path: '/users/a', schema });

    expect(fetchImpl.mock.calls.map((call) => call[1]?.method)).toEqual(['PUT', 'PATCH', 'DELETE']);
  });

  it('returns undefined for a 204 No Content response', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      clientWith(fetchImpl).get({ path: '/users/a', schema: noContentSchema }),
    ).resolves.toBeUndefined();
  });

  it('maps a malformed JSON success body to a parse error', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('this is not json', { status: 200 }));

    await expect(clientWith(fetchImpl).get({ path: '/users', schema })).rejects.toMatchObject({
      code: 'parse',
    });
  });

  it('maps a body-read failure on a text GET to a parse error', async () => {
    const stream = new ReadableStream({
      pull(controller) {
        controller.error(new Error('stream failed'));
      },
    });
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(stream, { status: 200 }));

    await expect(clientWith(fetchImpl).fetchText({ path: '/export.csv' })).rejects.toMatchObject({
      code: 'parse',
    });
  });

  it('maps a caller-initiated abort to an aborted error', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

    await expect(
      clientWith(fetchImpl).get({ path: '/users', schema, signal: controller.signal }),
    ).rejects.toMatchObject({
      code: 'aborted',
    });
  });

  it('maps a request that outlives its timeout to a timeout error', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => {
              reject(new DOMException('Aborted', 'AbortError'));
            },
            { once: true },
          );
        }),
    );

    await expect(
      clientWith(fetchImpl).get({ path: '/users', schema, timeoutMs: 20 }),
    ).rejects.toMatchObject({
      code: 'timeout',
    });
  });

  it('aborts the retry backoff when the caller cancels mid-wait', async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse({}, { status: 503 }))
        .mockResolvedValueOnce(jsonResponse({ id: 'a' }));

      const promise = clientWith(fetchImpl, { maxRetries: 1 }).get({
        path: '/users',
        schema,
        signal: controller.signal,
      });

      // Let the first attempt fail and reach the retry backoff.
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchImpl).toHaveBeenCalledTimes(1);

      controller.abort();
      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    } finally {
      vi.useRealTimers();
    }
  });
});

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiClient } from './client.js';
import { ApiClientError } from './errors.js';

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
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createApiClient, getApiClient } from './factory.js';

vi.mock('@c1rcle/config', () => ({
  getClientEnv: () => ({ NEXT_PUBLIC_API_BASE_URL: 'https://api.c1rcle.test' }),
}));

const schema = z.object({ id: z.string() });

function jsonFetch(): ReturnType<typeof vi.fn<typeof fetch>> {
  return vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify({ id: 'a' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('factory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createApiClient points requests at the validated base URL', async () => {
    const fetchImpl = jsonFetch();

    const result = await createApiClient({ fetchImpl }).get({ path: '/me', schema });

    expect(result).toEqual({ id: 'a' });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://api.c1rcle.test/me');
  });

  it('getApiClient returns a cached singleton', () => {
    const first = getApiClient();
    const second = getApiClient();

    expect(second).toBe(first);
  });

  it('createApiClient returns a fresh client per call', () => {
    expect(createApiClient()).not.toBe(createApiClient());
  });
});

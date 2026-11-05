import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createServerApiClient } from './server-client';

vi.mock('server-only', () => ({}));

const schema = z.object({ ok: z.boolean() });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockImplementation((_url, init) => {
    const headers = new Headers(init?.headers);
    const authenticated = headers
      .get('cookie')
      ?.includes('__Secure-better-auth.session_token=synthetic-session');
    return Promise.resolve(
      new Response(
        JSON.stringify(authenticated ? { ok: true } : { message: 'No active session' }),
        {
          status: authenticated ? 200 : 401,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Partner server API session forwarding', () => {
  it.each(['get', 'post'] as const)(
    'authenticates %s using the secure Gateway cookie name',
    async (method) => {
      const client = createServerApiClient(
        'c1rcle.active-org=org-1; better-auth.session_token=synthetic-session',
      );
      await expect(
        client[method]({
          path: '/api/v2/organizations/org-1/analytics/overview',
          schema,
          headers: { 'x-organization-id': 'org-1' },
        }),
      ).resolves.toEqual({ ok: true });
      const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
      expect(headers.get('cookie')).toBe(
        'c1rcle.active-org=org-1; better-auth.session_token=synthetic-session; __Secure-better-auth.session_token=synthetic-session',
      );
      expect(headers.get('x-organization-id')).toBe('org-1');
    },
  );

  it('preserves an existing secure cookie without duplicating or replacing it', async () => {
    const cookie = '__Secure-better-auth.session_token=synthetic-session; c1rcle.active-org=org-1';
    await createServerApiClient(cookie).get({ path: '/api/v2/auth/session', schema });
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('cookie')).toBe(cookie);
  });

  it('does not manufacture authentication from an organization cookie', async () => {
    await expect(
      createServerApiClient('c1rcle.active-org=org-1').get({
        path: '/api/v2/auth/session',
        schema,
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
});

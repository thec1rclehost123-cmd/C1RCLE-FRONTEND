import { afterEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from './gateway-proxy';

afterEach(() => vi.unstubAllGlobals());

describe('Guest support Gateway session forwarding', () => {
  it.each(['GET', 'POST'] as const)('forwards secure authentication for %s', async (method) => {
    const fetchMock = vi.fn<typeof fetch>((_url, init) => {
      const cookie = new Headers(init?.headers).get('cookie');
      return Promise.resolve(
        new Response(null, {
          status: cookie?.includes('__Secure-better-auth.session_token=synthetic-session')
            ? 200
            : 401,
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await forwardToGateway('/api/v2/help/tickets', {
      method,
      cookie: 'better-auth.session_token=synthetic-session',
    });
    expect(response.status).toBe(200);
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('cookie')).toBe(
      'better-auth.session_token=synthetic-session; __Secure-better-auth.session_token=synthetic-session',
    );
  });
});

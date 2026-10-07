import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { POST as forgotPassword } from './forgot-password/route';
import { POST as login } from './login/route';
import { POST as logout } from './logout/route';
import { POST as refresh } from './refresh/route';
import { POST as resetPassword } from './reset-password/route';
import { GET as session } from './session/route';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest's documented mock-factory pattern
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const ORIGIN = 'http://localhost:3000';
const CSRF = 'guest.c1rcle.csrf';
const mockForward = vi.mocked(forwardToGateway);

function gw(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  const headers = new Headers({ 'content-type': 'application/json' });
  for (const [k, v] of Object.entries(init.headers ?? {})) headers.append(k, v);
  return new Response(body === null ? null : JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

function req(
  method: 'GET' | 'POST',
  path: string,
  headers: Record<string, string> = {},
  body?: unknown,
): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, {
    method,
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const csrfHeaders = {
  cookie: `${CSRF}=tok; better-auth.session_token=sess`,
  'x-csrf-token': 'tok',
};

const SESSION_SET_COOKIE =
  'better-auth.session_token=sess_abc; Path=/; HttpOnly; Domain=api.c1rcle.test; Max-Age=604800; SameSite=None; Secure';
const AUTH_BODY = {
  user: { id: 'u1', email: 'g@x.com', displayName: 'G', role: 'guest', avatarUrl: null },
  accessToken: 'tok_abc',
  expiresAt: 1_900_000_000_000,
};

beforeEach(() => {
  mockForward.mockReset();
});

describe('POST /api/auth/login', () => {
  it('re-scopes the session cookie host-only/HttpOnly/Lax and mints the CSRF cookie', async () => {
    mockForward.mockResolvedValue(gw(AUTH_BODY, { headers: { 'set-cookie': SESSION_SET_COOKIE } }));
    const res = await login(
      req('POST', '/api/auth/login', {}, { email: 'g@x.com', password: 'pw' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ accessToken: 'tok_abc' });
    const cookies = res.headers.get('set-cookie') ?? '';
    expect(cookies).toContain('better-auth.session_token=sess_abc');
    expect(cookies).toContain(`${CSRF}=`);
    expect(cookies.toLowerCase()).not.toContain('domain=');
    expect(cookies.toLowerCase()).toContain('httponly');
    expect(cookies.toLowerCase()).toContain('samesite=lax');
    expect(cookies.toLowerCase()).not.toContain('samesite=none');
  });

  it('strips the __Secure- prefix a production gateway emits', async () => {
    mockForward.mockResolvedValue(
      gw(AUTH_BODY, {
        headers: {
          'set-cookie': SESSION_SET_COOKIE.replace('better-auth', '__Secure-better-auth'),
        },
      }),
    );
    const res = await login(
      req('POST', '/api/auth/login', {}, { email: 'g@x.com', password: 'pw' }),
    );

    expect(res.headers.get('set-cookie') ?? '').not.toContain('__Secure-');
  });

  it('rejects cross-origin without touching the gateway', async () => {
    const res = await login(
      req('POST', '/api/auth/login', { origin: 'http://evil.example' }, { email: 'a' }),
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('passes a generic 401 envelope through, whitelisting fields only', async () => {
    mockForward.mockResolvedValue(
      gw(
        {
          code: 'unauthorized',
          message: 'Invalid credentials.',
          status: 401,
          requestId: 'r1',
          stack: 'at secret.internal.host:5432',
        },
        { status: 401 },
      ),
    );
    const res = await login(
      req('POST', '/api/auth/login', {}, { email: 'g@x.com', password: 'x' }),
    );

    expect(res.status).toBe(401);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toEqual({
      code: 'unauthorized',
      message: 'Invalid credentials.',
      status: 401,
      requestId: 'r1',
    });
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('relays Retry-After on a 429', async () => {
    mockForward.mockResolvedValue(
      gw(
        { code: 'rate_limited', message: 'Slow down', status: 429, requestId: 'r' },
        { status: 429, headers: { 'retry-after': '30' } },
      ),
    );
    const res = await login(
      req('POST', '/api/auth/login', {}, { email: 'g@x.com', password: 'x' }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('30');
  });

  it('collapses a non-envelope upstream failure and never leaks the host', async () => {
    mockForward.mockResolvedValue(
      new Response('<html>502 from api.c1rcle.test</html>', { status: 502 }),
    );
    const res = await login(
      req('POST', '/api/auth/login', {}, { email: 'g@x.com', password: 'x' }),
    );
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('c1rcle.test');
  });

  it('returns a generic 502 when the gateway is unreachable', async () => {
    mockForward.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:443'));
    const res = await login(
      req('POST', '/api/auth/login', {}, { email: 'g@x.com', password: 'x' }),
    );
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('ECONNREFUSED');
  });

  it('strips prototype-pollution keys before forwarding', async () => {
    mockForward.mockResolvedValue(gw(AUTH_BODY));
    await login(
      new NextRequest(`${ORIGIN}/api/auth/login`, {
        method: 'POST',
        headers: { origin: ORIGIN, 'content-type': 'application/json' },
        body: '{"email":"g@x.com","password":"p","__proto__":{"x":1}}',
      }),
    );
    const forwarded = (mockForward.mock.calls[0]?.[1].body ?? {}) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(forwarded, '__proto__')).toBe(false);
  });
});

describe('POST /api/auth/logout', () => {
  it('requires CSRF', async () => {
    const res = await logout(req('POST', '/api/auth/logout'));
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('revokes via the gateway and expires both cookies', async () => {
    mockForward.mockResolvedValue(gw(null, { status: 204 }));
    const res = await logout(req('POST', '/api/auth/logout', csrfHeaders));

    expect(res.status).toBe(204);
    expect(mockForward).toHaveBeenCalledWith(
      '/api/v2/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
    const cookies = (res.headers.get('set-cookie') ?? '').toLowerCase();
    expect(cookies).toContain('better-auth.session_token=;');
    expect(cookies).toContain('max-age=0');
    expect(cookies).toContain(`${CSRF}=;`);
  });

  it('still expires the cookie when the gateway call fails', async () => {
    mockForward.mockRejectedValue(new Error('down'));
    const res = await logout(req('POST', '/api/auth/logout', csrfHeaders));

    expect(res.status).toBe(204);
    const cookies = (res.headers.get('set-cookie') ?? '').toLowerCase();
    expect(cookies).toContain('better-auth.session_token=;');
    expect(cookies).toContain('httponly');
    expect(cookies).toContain('max-age=0');
  });

  it('still expires the cookie when the gateway answers 500', async () => {
    mockForward.mockResolvedValue(
      gw({ code: 'server', message: 'x', status: 500 }, { status: 500 }),
    );
    const res = await logout(req('POST', '/api/auth/logout', csrfHeaders));
    expect(res.status).toBe(204);
    expect((res.headers.get('set-cookie') ?? '').toLowerCase()).toContain('max-age=0');
  });
});

describe('POST /api/auth/refresh', () => {
  it('re-scopes the refreshed cookie', async () => {
    mockForward.mockResolvedValue(gw(AUTH_BODY, { headers: { 'set-cookie': SESSION_SET_COOKIE } }));
    const res = await refresh(req('POST', '/api/auth/refresh', csrfHeaders));
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie') ?? '').toContain('sess_abc');
  });

  it('clears the dead cookies on a 401', async () => {
    mockForward.mockResolvedValue(
      gw(
        { code: 'unauthorized', message: 'expired', status: 401, requestId: 'r' },
        { status: 401 },
      ),
    );
    const res = await refresh(req('POST', '/api/auth/refresh', csrfHeaders));
    expect(res.status).toBe(401);
    expect((res.headers.get('set-cookie') ?? '').toLowerCase()).toContain('max-age=0');
  });

  it('requires CSRF', async () => {
    expect((await refresh(req('POST', '/api/auth/refresh'))).status).toBe(403);
  });
});

describe('GET /api/auth/session', () => {
  it('returns the session with no-store', async () => {
    mockForward.mockResolvedValue(gw({ user: AUTH_BODY.user, expiresAt: 1_900_000_000_000 }));
    const res = await session(
      req('GET', '/api/auth/session', { cookie: 'better-auth.session_token=s' }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('maps a gateway 401 to unauthorized and expires the cookies', async () => {
    mockForward.mockResolvedValue(
      gw({ code: 'unauthorized', message: 'x', status: 401 }, { status: 401 }),
    );
    const res = await session(req('GET', '/api/auth/session'));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'unauthorized' });
    expect((res.headers.get('set-cookie') ?? '').toLowerCase()).toContain('max-age=0');
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('returns the same constant ack whatever the upstream says', async () => {
    mockForward.mockResolvedValueOnce(gw({ status: true, message: 'A' }));
    const a = await forgotPassword(
      req('POST', '/api/auth/forgot-password', {}, { email: 'known@x.com' }),
    );
    mockForward.mockResolvedValueOnce(gw({ status: true, message: 'B different' }));
    const b = await forgotPassword(
      req('POST', '/api/auth/forgot-password', {}, { email: 'ghost@x.com' }),
    );

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(await a.json()).toEqual(await b.json());
    expect(mockForward.mock.calls[0]?.[0]).toBe('/api/v2/auth/forgot-password');
  });

  it('hides account-dependent upstream failures behind a generic 502', async () => {
    mockForward.mockResolvedValue(
      gw(
        { code: 'not_found', message: 'No such user', status: 404, requestId: 'r' },
        { status: 404 },
      ),
    );
    const res = await forgotPassword(
      req('POST', '/api/auth/forgot-password', {}, { email: 'ghost@x.com' }),
    );
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('No such user');
  });

  it('passes validation and throttling errors through, with Retry-After', async () => {
    mockForward.mockResolvedValueOnce(
      gw(
        { code: 'validation', message: 'Bad email', status: 400, requestId: 'r' },
        { status: 400 },
      ),
    );
    expect(
      (await forgotPassword(req('POST', '/api/auth/forgot-password', {}, { email: 'x' }))).status,
    ).toBe(400);

    mockForward.mockResolvedValueOnce(
      gw(
        { code: 'rate_limited', message: 'Slow', status: 429, requestId: 'r' },
        { status: 429, headers: { 'retry-after': '60' } },
      ),
    );
    const limited = await forgotPassword(
      req('POST', '/api/auth/forgot-password', {}, { email: 'a@x.com' }),
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
  });

  it('rejects cross-origin', async () => {
    const res = await forgotPassword(
      req(
        'POST',
        '/api/auth/forgot-password',
        { origin: 'http://evil.example' },
        { email: 'a@x.com' },
      ),
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password', () => {
  it('forwards token + password and acks without echoing the token', async () => {
    mockForward.mockResolvedValue(gw({ status: true }));
    const res = await resetPassword(
      req(
        'POST',
        '/api/auth/reset-password',
        {},
        { token: 'secret-tok', newPassword: 'newpassword1' },
      ),
    );
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).not.toContain('secret-tok');
    expect(mockForward.mock.calls[0]?.[0]).toBe('/api/v2/auth/reset-password');
  });

  it('maps an invalid-token error through as the flat envelope', async () => {
    mockForward.mockResolvedValue(
      gw(
        { code: 'validation', message: 'Invalid token', status: 400, requestId: 'r' },
        { status: 400 },
      ),
    );
    const res = await resetPassword(
      req('POST', '/api/auth/reset-password', {}, { token: 't', newPassword: 'newpassword1' }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: 'validation',
      message: 'Invalid token',
    });
  });

  it('never logs the token', async () => {
    const spies = [
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
    ];
    mockForward.mockResolvedValue(gw({ status: true }));
    await resetPassword(
      req(
        'POST',
        '/api/auth/reset-password',
        {},
        { token: 'secret-tok', newPassword: 'newpassword1' },
      ),
    );
    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain('secret-tok');
      spy.mockRestore();
    }
  });
});

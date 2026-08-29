import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { POST as login } from './login/route';
import { POST as logout } from './logout/route';
import { POST as refresh } from './refresh/route';
import { GET as session } from './session/route';
import { POST as signup } from './signup/route';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest's documented mock-factory pattern
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const APP_ORIGIN = 'http://localhost:3001';
const mockForward = vi.mocked(forwardToGateway);

function gatewayResponse(
  body: unknown,
  init: { status?: number; setCookie?: string } = {},
): Response {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (init.setCookie !== undefined) {
    headers.append('set-cookie', init.setCookie);
  }
  return new Response(body === null ? null : JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

function post(path: string, headers: Record<string, string>, body?: unknown): NextRequest {
  return new NextRequest(`${APP_ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const SESSION_COOKIE =
  'better-auth.session_token=sess_abc; Path=/; HttpOnly; Domain=api.c1rcle.test; Max-Age=604800; SameSite=None; Secure';
const AUTH_BODY = {
  user: { id: 'usr_1', email: 'a@b.com', displayName: 'A', role: 'partner', avatarUrl: null },
  accessToken: 'tok_abc',
  expiresAt: 1_900_000_000_000,
};

beforeEach(() => {
  mockForward.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/auth/signup', () => {
  it('forwards, returns 201, sets the CSRF cookie, and re-scopes the session cookie', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse(AUTH_BODY, { status: 201, setCookie: SESSION_COOKIE }),
    );

    const res = await signup(
      post('/api/auth/signup', { origin: APP_ORIGIN }, {
        email: 'a@b.com',
        password: 'password123',
        displayName: 'A',
      }),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ accessToken: 'tok_abc' });
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('c1rcle.csrf=');
    expect(setCookie).toContain('better-auth.session_token=sess_abc');
    expect(setCookie.toLowerCase()).not.toContain('domain=');
    expect(setCookie.toLowerCase()).toContain('httponly');
  });

  it('rejects a cross-origin request without touching the gateway', async () => {
    const res = await signup(
      post('/api/auth/signup', { origin: 'http://evil.example' }, { email: 'a@b.com' }),
    );

    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('strips prototype-pollution keys before forwarding', async () => {
    mockForward.mockResolvedValue(gatewayResponse(AUTH_BODY, { status: 201 }));

    const polluted = JSON.parse(
      '{"email":"a@b.com","password":"password123","displayName":"A","__proto__":{"polluted":true}}',
    ) as unknown;

    await signup(
      new NextRequest(`${APP_ORIGIN}/api/auth/signup`, {
        method: 'POST',
        headers: { origin: APP_ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify(polluted),
      }),
    );

    const forwardedBody = (mockForward.mock.calls[0]?.[1].body ?? {}) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(forwardedBody, '__proto__')).toBe(false);
    expect(forwardedBody['email']).toBe('a@b.com');
  });

  it('passes a gateway 422 envelope through', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse(
        { code: 'validation', message: 'Invalid', status: 422, fieldErrors: { email: ['taken'] } },
        { status: 422 },
      ),
    );

    const res = await signup(post('/api/auth/signup', { origin: APP_ORIGIN }, { email: 'a@b.com' }));

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({
      code: 'validation',
      fieldErrors: { email: ['taken'] },
    });
  });

  it('never logs the request body', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockForward.mockResolvedValue(gatewayResponse(AUTH_BODY, { status: 201 }));

    await signup(
      post('/api/auth/signup', { origin: APP_ORIGIN }, {
        email: 'secret@b.com',
        password: 'hunter2xx',
      }),
    );

    const logged = [...log.mock.calls, ...errorLog.mock.calls].flat().map((entry) => String(entry));
    expect(logged.join(' ')).not.toContain('hunter2xx');
  });
});

describe('POST /api/auth/login', () => {
  it('passes the gateway generic 401 through unchanged', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse(
        { code: 'unauthorized', message: 'Authentication failed', status: 401 },
        { status: 401 },
      ),
    );

    const res = await login(
      post('/api/auth/login', { origin: APP_ORIGIN }, { email: 'a@b.com', password: 'wrong' }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      code: 'unauthorized',
      message: 'Authentication failed',
      status: 401,
    });
  });
});

describe('POST /api/auth/refresh', () => {
  it('rejects without a CSRF token', async () => {
    const res = await refresh(post('/api/auth/refresh', { origin: APP_ORIGIN }));
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('forwards with the incoming cookie when the CSRF token matches', async () => {
    mockForward.mockResolvedValue(gatewayResponse(AUTH_BODY, { setCookie: SESSION_COOKIE }));

    const res = await refresh(
      post('/api/auth/refresh', {
        origin: APP_ORIGIN,
        'x-csrf-token': 'tok',
        cookie: 'c1rcle.csrf=tok; better-auth.session_token=sess_abc',
      }),
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledTimes(1);
    const [calledPath, calledInit] = mockForward.mock.calls[0] ?? [];
    expect(calledPath).toBe('/api/v2/auth/refresh');
    expect(calledInit?.cookie ?? '').toContain('better-auth.session_token=sess_abc');
  });
});

describe('POST /api/auth/logout', () => {
  it('rejects without a CSRF token', async () => {
    const res = await logout(post('/api/auth/logout', { origin: APP_ORIGIN }));
    expect(res.status).toBe(403);
  });

  it('returns 204 and clears the CSRF cookie when the token matches', async () => {
    mockForward.mockResolvedValue(new Response(null, { status: 204 }));

    const res = await logout(
      post('/api/auth/logout', {
        origin: APP_ORIGIN,
        'x-csrf-token': 'tok',
        cookie: 'c1rcle.csrf=tok',
      }),
    );

    expect(res.status).toBe(204);
    expect((res.headers.get('set-cookie') ?? '').toLowerCase()).toContain('c1rcle.csrf=;');
  });
});

describe('GET /api/auth/session', () => {
  it('normalises a gateway 401 to the flat envelope', async () => {
    mockForward.mockResolvedValue(gatewayResponse(null, { status: 401 }));

    const res = await session(
      new NextRequest(`${APP_ORIGIN}/api/auth/session`, { headers: { origin: APP_ORIGIN } }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'unauthorized' });
  });

  it('passes a valid session through', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({ user: AUTH_BODY.user, expiresAt: AUTH_BODY.expiresAt }),
    );

    const res = await session(
      new NextRequest(`${APP_ORIGIN}/api/auth/session`, { headers: { origin: APP_ORIGIN } }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ user: { id: 'usr_1' } });
  });
});

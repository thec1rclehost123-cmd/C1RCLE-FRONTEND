import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';

import {
  assertCsrf,
  assertSameOrigin,
  mintCsrfToken,
  passThroughGatewayError,
  rescopeSessionCookies,
  stripProtoKeys,
} from './auth-proxy';

const APP_ORIGIN = 'http://localhost:3001';

function request(headers: Record<string, string>): NextRequest {
  return new NextRequest(`${APP_ORIGIN}/api/auth/refresh`, { method: 'POST', headers });
}

describe('assertSameOrigin', () => {
  it('allows a same-origin request', () => {
    expect(assertSameOrigin(request({ origin: APP_ORIGIN }))).toBeNull();
  });

  it('allows a request with no Origin header (server-to-server / same-origin GET)', () => {
    expect(assertSameOrigin(request({}))).toBeNull();
  });

  it('rejects a cross-origin Origin', async () => {
    const res = assertSameOrigin(request({ origin: 'http://evil.example' }));
    expect(res?.status).toBe(403);
    await expect(res?.json()).resolves.toMatchObject({ code: 'forbidden' });
  });

  it('rejects Sec-Fetch-Site: cross-site', () => {
    expect(assertSameOrigin(request({ 'sec-fetch-site': 'cross-site' }))?.status).toBe(403);
  });
});

describe('assertCsrf', () => {
  it('passes when the cookie and header match', () => {
    const req = request({ 'x-csrf-token': 'tok-123', cookie: 'c1rcle.csrf=tok-123' });
    expect(assertCsrf(req)).toBeNull();
  });

  it('rejects a mismatch', () => {
    const req = request({ 'x-csrf-token': 'tok-123', cookie: 'c1rcle.csrf=different' });
    expect(assertCsrf(req)?.status).toBe(403);
  });

  it('rejects a missing token', () => {
    expect(assertCsrf(request({ cookie: 'c1rcle.csrf=tok-123' }))?.status).toBe(403);
    expect(assertCsrf(request({ 'x-csrf-token': 'tok-123' }))?.status).toBe(403);
    expect(assertCsrf(request({}))?.status).toBe(403);
  });
});

describe('stripProtoKeys', () => {
  it('removes __proto__ / constructor / prototype at any depth', () => {
    const input = JSON.parse(
      '{"email":"a@b.com","nested":{"__proto__":{"polluted":true},"ok":1},"list":[{"constructor":"x","y":2}]}',
    ) as Record<string, unknown>;

    const cleaned = stripProtoKeys(input) as {
      email: string;
      nested: Record<string, unknown>;
      list: Record<string, unknown>[];
    };

    expect(cleaned.email).toBe('a@b.com');
    expect(Object.prototype.hasOwnProperty.call(cleaned.nested, '__proto__')).toBe(false);
    expect(cleaned.nested['ok']).toBe(1);
    expect(cleaned.list[0]).not.toHaveProperty('constructor');
    expect(cleaned.list[0]?.['y']).toBe(2);
  });
});

describe('mintCsrfToken', () => {
  it('returns a fresh base64url token each call', () => {
    const a = mintCsrfToken();
    const b = mintCsrfToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(42);
  });
});

describe('rescopeSessionCookies', () => {
  it('re-emits gateway cookies host-only with HttpOnly + SameSite=Lax, Domain dropped', () => {
    const gatewayResponse = new Response(null, { status: 200 });
    gatewayResponse.headers.append(
      'set-cookie',
      'better-auth.session_token=abc123; Path=/; HttpOnly; Domain=api.c1rcle.test; Max-Age=604800; SameSite=None; Secure',
    );

    const out = new NextResponse(null, { status: 200 });
    const names = rescopeSessionCookies(gatewayResponse, out);

    expect(names).toEqual(['better-auth.session_token']);
    const setCookie = out.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('better-auth.session_token=abc123');
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain('samesite=lax');
    expect(setCookie.toLowerCase()).not.toContain('domain=');
  });
});

describe('passThroughGatewayError', () => {
  it('passes a well-formed flat envelope through unchanged', async () => {
    const res = passThroughGatewayError(
      401,
      JSON.stringify({ code: 'unauthorized', message: 'Authentication failed', status: 401 }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      code: 'unauthorized',
      message: 'Authentication failed',
    });
  });

  it('synthesises a generic envelope for a non-JSON body', async () => {
    const res = passThroughGatewayError(502, '<html>Bad Gateway</html>');
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ code: 'server' });
  });
});

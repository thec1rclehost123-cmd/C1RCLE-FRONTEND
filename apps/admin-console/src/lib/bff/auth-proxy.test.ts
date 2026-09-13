import { NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetEnvCacheForTests } from '@c1rcle/config';

import { rescopeSessionCookies } from './auth-proxy.js';

// `rescopeSessionCookies` reads `NEXT_PUBLIC_ENVIRONMENT` (via
// `isProduction()`) to decide the `secure` cookie flag.
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080');
  vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'C1RCLE Admin Console');
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'development');
  resetEnvCacheForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvCacheForTests();
});

/**
 * Regression test for a real bug found while running the whole admin
 * console locally end to end: Better Auth's gateway Set-Cookie value is
 * already percent-encoded (same as any standard `cookie` package default).
 * `rescopeSessionCookies` used to pass that raw, still-encoded string
 * straight to `res.cookies.set`, which encodes it again on output — a
 * double-encoded cookie round-trips to the browser fine, but the token the
 * gateway reads back on the next request no longer matches any stored
 * session, so every `/api/auth/refresh` after login failed with
 * "No active session", logging the admin straight back out on the very
 * first navigation that needed a fresh token.
 */
describe('rescopeSessionCookies', () => {
  it('stores the session token decoded exactly once, not double-encoded', () => {
    // A token containing base64 padding (`=`), which Better Auth's own
    // cookie serializer escapes to `%3D` in the real Set-Cookie header.
    const rawToken = 'abc123.XYZsomeSignature==';
    const encodedOnce = encodeURIComponent(rawToken);
    const gatewayResponse = new Response(null, {
      headers: {
        'set-cookie': `better-auth.session_token=${encodedOnce}; Path=/; HttpOnly; SameSite=lax`,
      },
    });

    const res = NextResponse.json({ ok: true });
    const names = rescopeSessionCookies(gatewayResponse, res);

    expect(names).toEqual(['better-auth.session_token']);
    expect(res.cookies.get('better-auth.session_token')?.value).toBe(rawToken);
  });

  it('rescopes multiple Set-Cookie headers (session + csrf-adjacent cookies)', () => {
    const gatewayResponse = new Response(null);
    gatewayResponse.headers.append(
      'set-cookie',
      `better-auth.session_token=${encodeURIComponent('tok.one=')}; Path=/`,
    );
    gatewayResponse.headers.append(
      'set-cookie',
      `some-other-cookie=${encodeURIComponent('value/with+specials=')}; Path=/`,
    );

    const res = NextResponse.json({ ok: true });
    const names = rescopeSessionCookies(gatewayResponse, res);

    expect(names).toEqual(['better-auth.session_token', 'some-other-cookie']);
    expect(res.cookies.get('better-auth.session_token')?.value).toBe('tok.one=');
    expect(res.cookies.get('some-other-cookie')?.value).toBe('value/with+specials=');
  });
});

import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { proxy } from './proxy';

vi.mock('@c1rcle/config', () => ({
  getClientEnv: () => ({
    NEXT_PUBLIC_API_BASE_URL: 'https://circle-v2-backend.onrender.com',
    NEXT_PUBLIC_APP_NAME: 'partner-dashboard',
    NEXT_PUBLIC_ENVIRONMENT: 'development',
    NEXT_PUBLIC_SENTRY_DSN: null,
  }),
}));

const APP_ORIGIN = 'http://localhost:3001';

function request(pathname: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${APP_ORIGIN}${pathname}`, { method: 'GET', headers });
}

describe('proxy.session-gate', () => {
  it('passes an anonymous GET /onboard — the wizard is the signup entry point', () => {
    const res = proxy(request('/onboard'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('passes an anonymous /onboard?type=venue after role selection', () => {
    expect(proxy(request('/onboard?type=venue')).status).toBe(200);
  });

  it('passes /onboard for a cookie-bearing visitor under either cookie name', () => {
    expect(proxy(request('/onboard', { cookie: 'better-auth.session_token=abc' })).status).toBe(
      200,
    );
    expect(
      proxy(request('/onboard', { cookie: '__Secure-better-auth.session_token=abc' })).status,
    ).toBe(200);
  });

  it('redirects an anonymous GET /venue to /login?next=/venue', () => {
    const res = proxy(request('/venue'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${APP_ORIGIN}/login?next=%2Fvenue`);
  });

  it('lets a cookie-bearing visitor through a gated host path', () => {
    expect(proxy(request('/host', { cookie: 'better-auth.session_token=abc' })).status).toBe(200);
  });
});

describe('proxy.csp-nonce', () => {
  it('stamps a Content-Security-Policy header on page responses', () => {
    const res = proxy(request('/onboard'));
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(res.headers.get('Content-Security-Policy')).toContain("'strict-dynamic'");
  });
});

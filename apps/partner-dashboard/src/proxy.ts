/**
 * App Bouncer — edge auth redirect + per-request CSP nonce.
 *
 * UX redirect only — real auth is per-request at the gateway.
 *
 * This proxy is a fast UX redirect, NOT a security boundary: the edge cannot
 * validate the httpOnly session cookie (it has no secret), so it only checks
 * cookie *presence*. A visitor landing on a gated path with no cookie is sent
 * to `/login?next=<path>` for a smooth experience; real enforcement — a `401`
 * / `403` — happens per request at the backend gateway, which re-validates the
 * session for every call.
 *
 * The proxy also mints a fresh nonce per request and stamps the
 * `Content-Security-Policy` header with the spec §11.3 directives (Next 16
 * nonce pattern). Nonces require dynamic rendering: a fresh nonce is generated
 * on every render, so static optimisation, ISR and PPR are disabled app-wide.
 */

import { NextResponse } from 'next/server';

import { getClientEnv } from '@c1rcle/config';

import type { NextRequest } from 'next/server';

/**
 * Better Auth's default httpOnly session cookie, re-scoped to the frontend
 * origin by the auth BFF (`src/lib/bff/auth-proxy.ts`). Absence here is the
 * only signal the edge can read; the gateway re-validates at every call.
 */
const SESSION_COOKIE = 'better-auth.session_token';

/** Paths that demand a session. Host/path-char gating is done in the handler. */
const AUTH_GATED_PREFIXES = [
  '/venue',
  '/host',
  '/promoter',
  '/onboard',
  '/partner',
  '/partner-network',
];

/** Gateway origin for `connect-src`, read once via @c1rcle/config at module load. */
const GATEWAY_ORIGIN = getClientEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');

/** Development-mode CSP needs `'unsafe-eval'` for React's dev error stacks. */
const IS_DEV = getClientEnv().NEXT_PUBLIC_ENVIRONMENT === 'development';

function isAuthGated(pathname: string): boolean {
  return AUTH_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildContentSecurityPolicy(nonce: string): string {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${IS_DEV ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' ${GATEWAY_ORIGIN};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  return cspHeader.replace(/\s{2,}/g, ' ').trim();
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  if (
    request.method === 'GET' &&
    isAuthGated(request.nextUrl.pathname) &&
    !request.cookies.has(SESSION_COOKIE)
  ) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    return response;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    /*
     * The specific paths drive the auth redirect; the negative pattern is for
     * the CSP nonce (skip API routes and static assets, per the docs).
     */
    '/venue/:path*',
    '/host/:path*',
    '/promoter/:path*',
    '/onboard/:path*',
    '/partner/:path*',
    '/partner-network/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

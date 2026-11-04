import { NextResponse } from 'next/server';

import {
  forwardToGateway,
  mintCsrfToken,
  rescopeSessionCookies,
  setCsrfCookie,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const failure = () => NextResponse.redirect(new URL('/login?reason=google', req.url));
  try {
    // Restore production gateway cookie names after frontend host-only re-scoping.
    let cookie = req.headers.get('cookie') ?? '';
    for (const pair of cookie.split(';')) {
      const trimmed = pair.trim();
      if (/^better-auth\.(oauth_state|state)=/.test(trimmed)) cookie += `; __Secure-${trimmed}`;
    }
    const upstream = await forwardToGateway(`/api/v2/auth/callback/google${req.nextUrl.search}`, {
      method: 'GET',
      cookie,
    });
    const location = upstream.headers.get('location');
    if (!location || upstream.status < 300 || upstream.status >= 400) return failure();
    const target = new URL(location, req.url);
    if (target.origin !== req.nextUrl.origin) return failure();
    // Keep native callback errors out of Guest URLs and text.
    if (target.searchParams.has('error')) return failure();
    const response = NextResponse.redirect(target);
    rescopeSessionCookies(upstream, response);
    setCsrfCookie(response, mintCsrfToken());
    response.headers.set('cache-control', 'no-store');
    return response;
  } catch {
    return failure();
  }
}

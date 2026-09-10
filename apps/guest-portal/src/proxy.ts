import { NextResponse } from 'next/server';

import { getClientEnv, getServerEnv } from '@c1rcle/config';

import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'better-auth.session_token';
const PRIVATE_PREFIXES = ['/profile', '/tickets', '/checkout', '/confirmation'];

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest): NextResponse {
  const { VERCEL_ENV } = getServerEnv();
  const environment = VERCEL_ENV ?? getClientEnv().NEXT_PUBLIC_ENVIRONMENT;
  const url = request.nextUrl.clone();
  const requestHost =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim().split(':')[0] ??
    request.headers.get('host')?.split(':')[0] ??
    url.hostname;
  const requestProtocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? url.protocol.slice(0, -1);
  const isCanonicalHost = requestHost === 'thec1rcle.com' || requestHost === 'www.thec1rcle.com';

  if (
    environment === 'production' &&
    isCanonicalHost &&
    (requestProtocol !== 'https' || requestHost === 'www.thec1rcle.com')
  ) {
    url.protocol = 'https:';
    url.hostname = 'thec1rcle.com';
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  if (
    (request.method === 'GET' || request.method === 'HEAD') &&
    isPrivatePath(url.pathname) &&
    !request.cookies.has(SESSION_COOKIE)
  ) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', url.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set(
      'X-Robots-Tag',
      environment === 'production' ? 'noindex, follow, noarchive' : 'noindex, nofollow, noarchive',
    );
    return response;
  }

  const response = NextResponse.next();
  if (environment !== 'production') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  if (isPrivatePath(url.pathname)) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set(
      'X-Robots-Tag',
      environment === 'production' ? 'noindex, follow, noarchive' : 'noindex, nofollow, noarchive',
    );
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

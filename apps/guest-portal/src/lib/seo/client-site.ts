import { getClientEnv } from '@c1rcle/config';

const PRODUCTION_ORIGIN = 'https://thec1rcle.com';

/** Build absolute URLs in Client Component trees without importing server env. */
export function absoluteClientUrl(pathname: string): string {
  if (/^https?:\/\//i.test(pathname)) return new URL(pathname).toString();
  const environment = getClientEnv();
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : environment.NEXT_PUBLIC_ENVIRONMENT === 'production'
        ? PRODUCTION_ORIGIN
        : 'http://localhost:3000';
  return new URL(pathname.replace(/^\/?/, '/'), origin).toString();
}

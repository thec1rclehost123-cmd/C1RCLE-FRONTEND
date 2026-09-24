import 'server-only';

import { getClientEnv, getServerEnv } from '@c1rcle/config';

export type SeoEnvironment = 'production' | 'non-production';

const PRODUCTION_ORIGIN = 'https://thec1rcle.com';

function normalizeOrigin(value: string): URL {
  const url = new URL(value);
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url;
}

export function getSeoEnvironment(): SeoEnvironment {
  const client = getClientEnv();
  if (typeof window !== 'undefined') {
    return client.NEXT_PUBLIC_ENVIRONMENT === 'production' ? 'production' : 'non-production';
  }
  const server = getServerEnv();

  if (server.VERCEL_ENV !== undefined) {
    return server.VERCEL_ENV === 'production' ? 'production' : 'non-production';
  }

  return client.NEXT_PUBLIC_ENVIRONMENT === 'production' ? 'production' : 'non-production';
}

export function isProductionSeo(): boolean {
  return getSeoEnvironment() === 'production';
}

export function getSiteUrl(): URL {
  if (typeof window !== 'undefined') {
    return isProductionSeo() ? new URL(PRODUCTION_ORIGIN) : new URL('http://localhost:3000');
  }
  const server = getServerEnv();

  if (server.SITE_URL !== undefined) return normalizeOrigin(server.SITE_URL);
  if (isProductionSeo()) return new URL(PRODUCTION_ORIGIN);
  if (server.VERCEL_URL !== undefined) return normalizeOrigin(`https://${server.VERCEL_URL}`);

  return new URL('http://localhost:3000');
}

export function absoluteUrl(pathname: string): string {
  if (/^https?:\/\//i.test(pathname)) return new URL(pathname).toString();
  return new URL(pathname.replace(/^\/?/, '/'), getSiteUrl()).toString();
}

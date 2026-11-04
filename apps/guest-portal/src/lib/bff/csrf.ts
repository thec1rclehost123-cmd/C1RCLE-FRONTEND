import { getClientEnv } from '@c1rcle/config';

/**
 * Echo only this app's namespaced double-submit token. Browser cookies are
 * host-scoped rather than port-scoped, so Partner and Admin tokens can exist
 * alongside the Guest Portal token during local cross-app work.
 */
export function csrfHeaders(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const name = `${getClientEnv().NEXT_PUBLIC_APP_ID}.c1rcle.csrf=`;
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(name));
  const value = entry?.slice(name.length);
  return value ? { 'x-csrf-token': decodeURIComponent(value) } : {};
}

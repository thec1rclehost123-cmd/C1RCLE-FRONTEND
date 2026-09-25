/*
 * Reads the double-submit CSRF token the BFF set on login/signup (and the
 * onboarding `me` route mints for returning applicants), for the
 * `x-csrf-token` header that the BFF's `assertCsrf` expects on state-changing
 * calls. The cookie name is the app-namespaced one from the BFF's own
 * `auth-proxy.ts` (each app on a shared host must not collide), not the fixed
 * `c1rcle.csrf` — the token is only valid if reader and `assertCsrf` agree on
 * the name.
 */
import { csrfCookieName, CSRF_HEADER } from '@/lib/bff/auth-proxy';

export function csrfHeaders(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }
  const name = csrfCookieName();
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(document.cookie);
  return match?.[1] !== undefined ? { [CSRF_HEADER]: decodeURIComponent(match[1]) } : {};
}
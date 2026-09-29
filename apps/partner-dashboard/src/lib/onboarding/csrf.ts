import { getClientEnv } from '@c1rcle/config';

/*
 * Reads the double-submit CSRF token the BFF set on login/signup (and the
 * onboarding `me` route mints for returning applicants), for the
 * `x-csrf-token` header that the BFF's `assertCsrf` expects on state-changing
 * calls. Mirrors the private helper in `@c1rcle/auth`.
 */
const CSRF_HEADER = 'x-csrf-token';

export function csrfHeaders(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }
  const csrfCookieName = `${getClientEnv().NEXT_PUBLIC_APP_ID}.c1rcle.csrf`;
  const match = new RegExp(`(?:^|;\\s*)${csrfCookieName}=([^;]+)`).exec(document.cookie);
  return match?.[1] !== undefined ? { [CSRF_HEADER]: decodeURIComponent(match[1]) } : {};
}

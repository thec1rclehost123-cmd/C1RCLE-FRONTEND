import { createApiClient } from '@c1rcle/api-client';
import { clearSession } from '@c1rcle/auth';

/**
 * Same-origin client for the app's own BFF routes (`/api/**`). The BFF owns
 * gateway cookie forwarding and the CSRF check, so no bearer token or reauth
 * cycle is involved here — the browser's httpOnly session cookie (re-scoped to
 * this origin by the auth BFF) is what authenticates. A `401` means the gateway
 * session itself is gone, so the app clears the session and falls back to
 * `/login` instead of trying to refresh a dead cookie jar.
 *
 * Server components must NOT import this module: it holds browser-only state.
 */
let redirecting = false;

export const bffClient = createApiClient({
  baseUrl: typeof window === 'undefined' ? '' : window.location.origin,
  onUnauthorized: () => {
    if (!redirecting) {
      redirecting = true;
      clearSession();
      window.location.assign(new URL('/login', window.location.origin).toString());
    }
  },
});

import { createApiClient } from '@c1rcle/api-client';
import { clearSession, getAccessToken, refresh } from '@c1rcle/auth';

/**
 * Composition root for the browser-side API client.
 *
 * `getToken` hands the in-memory access token to every request; a 401 first
 * tries one silent `reauth` (refresh cookie exchange) and replays the request;
 * if that fails, `onUnauthorized` clears the session and falls back to
 * `/login` exactly once — the proxy then handles the redirect on the next nav.
 *
 * Server components must NOT import this module: it holds browser-only state.
 */
let redirecting = false;

export const apiClient = createApiClient({
  getToken: getAccessToken,
  reauth: () => refresh(),
  onUnauthorized: () => {
    if (!redirecting) {
      redirecting = true;
      clearSession();
      window.location.assign(new URL('/login', window.location.origin).toString());
    }
  },
});
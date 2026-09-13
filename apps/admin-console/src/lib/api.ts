'use client';

/**
 * The browser-side gateway client for the Admin Console.
 *
 * Lazy (built on first call, not at import) so importing this module is safe
 * in tests and server contexts that lack the validated public environment.
 *
 * The token comes from the in-memory `@c1rcle/auth` store; `reauth` performs
 * one refresh via the BFF; a terminal 401 clears the session and bounces to
 * the login page so a revoked/suspended admin can never be stuck mid-screen.
 */
import { createApiClient } from '@c1rcle/api-client';
import { getAccessToken, logout, refresh } from '@c1rcle/auth';

const LOGIN_PATH = '/login';

let singleton: ReturnType<typeof createApiClient> | undefined;
let redirecting = false;

export function getAdminApiClient() {
  singleton ??= createApiClient({
    getToken: () => getAccessToken(),
    reauth: () => refresh(),
    onUnauthorized: () => {
      void logout();
      if (
        !redirecting &&
        typeof window !== 'undefined' &&
        window.location.pathname !== LOGIN_PATH
      ) {
        redirecting = true;
        window.location.assign(new URL(LOGIN_PATH, window.location.origin).toString());
      }
    },
  });
  return singleton;
}

/** One idempotency key per mutation — reusing a key replays the same command. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
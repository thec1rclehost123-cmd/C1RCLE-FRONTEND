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

type AdminClient = ReturnType<typeof createApiClient>;
type MutatingMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * One idempotency key per user INTENT, not per call. The key is remembered by
 * method + path + body and reused on every retry of the same attempt; it is
 * dropped only after the request succeeds (so the next identical action is a
 * new intent). A changed body (e.g. a different reject reason) is a new intent.
 */
export function withIntentKeys(client: AdminClient): AdminClient {
  const inflight = new Map<string, string>();
  const send = (method: MutatingMethod, options: Parameters<AdminClient['request']>[0]) => {
    const headers = (options.headers ?? {}) as Record<string, string>;
    const supplied = headers['idempotency-key'];
    if (supplied === undefined) {
      return client.request({ ...options, method });
    }
    const intent = `${method} ${options.path} ${JSON.stringify(options.body ?? null)}`;
    const key = inflight.get(intent) ?? supplied;
    inflight.set(intent, key);
    return client
      .request({ ...options, method, headers: { ...headers, 'idempotency-key': key } })
      .then((result) => {
        inflight.delete(intent);
        return result;
      });
  };
  const overrides: Record<string, unknown> = {
    post: (o: never) => send('POST', o),
    put: (o: never) => send('PUT', o),
    patch: (o: never) => send('PATCH', o),
    delete: (o: never) => send('DELETE', o),
  };
  return new Proxy(client, {
    get(target, prop) {
      if (typeof prop === 'string' && prop in overrides) {
        return overrides[prop];
      }
      const value: unknown = Reflect.get(target, prop, target);
      return typeof value === 'function' ? (value as () => unknown).bind(target) : value;
    },
  });
}

let singleton: AdminClient | undefined;
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

let bffSingleton: ReturnType<typeof createApiClient> | undefined;

/**
 * Same-origin client for this app's own `app/api` BFF routes (e.g.
 * `/api/health/*`), as opposed to the gateway. Those routes hold any
 * server-side credential themselves, so no bearer token or reauth is
 * involved here. Browser-only: the base URL is the current origin.
 */
export function getAdminBffClient() {
  bffSingleton ??= createApiClient({ baseUrl: window.location.origin });
  return bffSingleton;
}

/** One idempotency key per mutation — reusing a key replays the same command. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

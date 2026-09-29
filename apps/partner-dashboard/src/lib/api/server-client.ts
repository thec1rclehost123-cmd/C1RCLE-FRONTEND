import 'server-only';

import { createApiClient } from '@c1rcle/api-client';

import type { z } from 'zod';

/**
 * Server-side API client, built **per request**.
 *
 * A Server Component must never reach for `@/lib/api/client` — that module
 * holds the in-memory access token and a module-level `redirecting` flag, both
 * per-browser, and reusing it on the server would leak one user's session into
 * another user's render.
 *
 * Auth here is the **forwarded session cookie**, not a bearer token. That is
 * deliberate and matches `@c1rcle/auth/server-session`: this is a trusted
 * server-to-server hop to our own gateway, which validates the httpOnly session
 * cookie it receives. `getToken` therefore returns `null` — there is no
 * in-memory token on a server, and pretending otherwise by caching one is
 * exactly the cross-request leak this module exists to avoid.
 *
 * Only the methods the server-rendered repositories need are exposed. That is a
 * deliberate narrowing, not an oversight: a smaller surface is one fewer place
 * for a cookie-bearing client to end up somewhere it shouldn't.
 */
export interface ServerApiClient {
  get<T>(options: { path: string; schema: z.ZodType<T>; headers?: HeaderBag }): Promise<T>;
  post<T>(options: {
    path: string;
    schema: z.ZodType<T>;
    body?: unknown;
    headers?: HeaderBag;
  }): Promise<T>;
}

type HeaderBag = Readonly<Record<string, string>>;

export function createServerApiClient(cookieHeader: string): ServerApiClient {
  const inner = createApiClient({
    getToken: () => null,
    // No `reauth` and no `onUnauthorized` on the server, on purpose. A 401 here
    // means *this request* has no valid session; the correct response is to
    // render the signed-out state, not to silently refresh a cookie the server
    // does not own and cannot write back to.
  });

  // `exactOptionalPropertyTypes` is on in this repo, so an absent header bag has
  // to stay absent rather than being passed through as an explicit `undefined`.
  const withCookie = (headers: HeaderBag | undefined): { headers?: HeaderBag } => {
    if (!cookieHeader) return headers ? { headers } : {};
    return { headers: { ...headers, cookie: cookieHeader } };
  };

  return {
    get: (options) => inner.get({ ...options, ...withCookie(options.headers) }),
    post: (options) => inner.post({ ...options, ...withCookie(options.headers) }),
  };
}

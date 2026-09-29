import { getClientEnv } from '@c1rcle/config';

import {
  ACTIVE_ORG_COOKIE_NAME,
  getActiveOrgId,
  getActiveOrgIdFromCookieHeader,
} from './active-org-cookie';

/**
 * ─── Active organization (browser) ──────────────────────────────────────────
 *
 * The cookie *writers* and the browser read live here. The pure parsing lives in
 * `active-org-cookie.ts` — see that file for why it had to be split out.
 *
 * ⚠️ This module imports `@c1rcle/auth`, so it is **not** server-safe. A Server
 * Component must import `getActiveOrgIdFromCookieHeader` from
 * `@/lib/org/active-org-cookie` instead, or the RSC build fails on
 * `useSyncExternalStore`.
 */

function isProduction(): boolean {
  return getClientEnv().NEXT_PUBLIC_ENVIRONMENT === 'production';
}

export { ACTIVE_ORG_COOKIE_NAME, getActiveOrgId, getActiveOrgIdFromCookieHeader };

/**
 * Sets or clears the active organization ID cookie, and triggers token refresh for token rotation.
 * `c1rcle.active-org` is an id hint, not a credential — it is intentionally readable by
 * both client and server, unlike the access token (memory-only) or the session cookie (httpOnly).
 *
 * Deliberately does NOT call `auth.refresh()` here: the gateway derives the
 * actor's org per request from `x-organization-id` + membership lookup
 * (`plugins/auth.ts`), so the Bearer token carries no org claim to rotate.
 * The previous refresh call was actively harmful — `refresh()` wipes the
 * in-memory session (`clearSession()`) on ANY failure, so a single spurious
 * `401` from the speculative post-switch refresh signed a just-logged-in user
 * straight back out (login 200 → org/access 200s → refresh 401 → anonymous
 * with a stale "no partner access" error on screen).
 */
export function setActiveOrg(orgId: string | null): void {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = isProduction() ? '; Secure' : '';

  if (orgId) {
    document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=${encodeURIComponent(orgId)}; path=/; SameSite=Lax; max-age=31536000${secure}`;
  } else {
    document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=; path=/; SameSite=Lax; max-age=0${secure}`;
  }
}

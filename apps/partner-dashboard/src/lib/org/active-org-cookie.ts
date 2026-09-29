/**
 * ─── Active-organization cookie (pure) ─────────────────────────────────────
 *
 * Split out of `active-org.ts` so a Server Component can read the active org
 * without dragging the browser auth barrel into the server module graph.
 *
 * WHY THE SPLIT: `active-org.ts` also exports `setActiveOrg`, which needs
 * `@c1rcle/auth` for token rotation. That package's barrel re-exports
 * `session-store`, which calls `useSyncExternalStore` — a Client-Component-only
 * React API. A Server Component importing the *read* half therefore failed the
 * production build with "You're importing a module that depends on
 * `useSyncExternalStore` into a React Server Component module" — while passing
 * `tsc`, lint and every unit test, because none of those run the RSC graph.
 *
 * The lesson, since it is easy to repeat: "this file has no `next/*` import,
 * so it is server-safe" is a claim about *this* file's imports, and a single
 * sibling import of a browser barrel invalidates it. A module that a Server
 * Component will import must have no transitive path to client-only state.
 *
 * Everything here is pure string parsing — no React, no browser globals, no
 * framework import — so it is safe from either environment.
 */

const ACTIVE_ORG_COOKIE_NAME = 'c1rcle.active-org';

function parseActiveOrgCookie(cookieHeader: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    if (key === ACTIVE_ORG_COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Reads `c1rcle.active-org` out of a raw `Cookie` header string. Takes the
 * header as an argument rather than reading it itself, so it stays
 * framework-agnostic (no `next/*` import) and is callable from a Server
 * Component, a layout, or a test:
 *
 *   getActiveOrgIdFromCookieHeader((await cookies()).toString())
 *
 * This mirrors `getServerSession`'s cookie-header-in pattern in
 * `@c1rcle/auth/server-session`.
 */
export function getActiveOrgIdFromCookieHeader(cookieHeader: string): string | null {
  return parseActiveOrgCookie(cookieHeader);
}

/**
 * Reads the same cookie out of `document.cookie`. Browser only — returns `null`
 * on the server. Prefer `getActiveOrgIdFromCookieHeader` from any Server
 * Component.
 */
export function getActiveOrgId(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  return parseActiveOrgCookie(document.cookie);
}

export { ACTIVE_ORG_COOKIE_NAME };

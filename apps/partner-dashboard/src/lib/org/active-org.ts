import { refresh } from '@c1rcle/auth';
import { getClientEnv } from '@c1rcle/config';

const ACTIVE_ORG_COOKIE_NAME = 'c1rcle.active-org';

function isProduction(): boolean {
  return getClientEnv().NEXT_PUBLIC_ENVIRONMENT === 'production';
}

/**
 * Gets the current active organization ID from the browser cookie.
 * Client-side only — for Server Components / layouts, pass the incoming
 * request's cookie header to `getActiveOrgIdFromCookieHeader` instead.
 */
export function getActiveOrgId(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  return parseActiveOrgCookie(document.cookie);
}

/**
 * Reads `c1rcle.active-org` out of a raw `Cookie` header string. Framework-agnostic
 * (no `next/*` import) so it can be called from a Server Component or layout via
 * `getActiveOrgIdFromCookieHeader((await cookies()).toString())` — mirrors
 * `getServerSession`'s cookie-header-in pattern in `@c1rcle/auth`.
 */
export function getActiveOrgIdFromCookieHeader(cookieHeader: string): string | null {
  return parseActiveOrgCookie(cookieHeader);
}

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
 * Sets or clears the active organization ID cookie, and triggers token refresh for token rotation.
 * `c1rcle.active-org` is an id hint, not a credential — it is intentionally readable by
 * both client and server, unlike the access token (memory-only) or the session cookie (httpOnly).
 */
export async function setActiveOrg(orgId: string | null): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = isProduction() ? '; Secure' : '';

  if (orgId) {
    document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=${encodeURIComponent(orgId)}; path=/; SameSite=Lax; max-age=31536000${secure}`;
  } else {
    document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=; path=/; SameSite=Lax; max-age=0${secure}`;
  }

  // Trigger token refresh to issue a token stamped with the new active org context.
  // A failure here is not fatal — the next gateway call will 401 and go through
  // the normal reauth path in the api-client composition root — so it is swallowed.
  try {
    await refresh();
  } catch {
    // Intentionally swallowed; see comment above.
  }
}

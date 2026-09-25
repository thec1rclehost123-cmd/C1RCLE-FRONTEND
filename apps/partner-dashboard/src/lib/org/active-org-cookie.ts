export const ACTIVE_ORG_COOKIE_NAME = 'c1rcle.active-org';

export function getActiveOrgIdFromCookieHeader(cookieHeader: string): string | null {
  return parseActiveOrgCookie(cookieHeader);
}

export function parseActiveOrgCookie(cookieHeader: string): string | null {
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(';')) {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    if (key === ACTIVE_ORG_COOKIE_NAME && value) return decodeURIComponent(value);
  }

  return null;
}

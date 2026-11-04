/**
 * The one place that knows how a browser session cookie must be presented to
 * the gateway.
 *
 * The frontend stores the Better-Auth session cookie under the unprefixed name
 * (`better-auth.session_token`): the BFF strips the `__Secure-` prefix from what
 * the gateway issues so the cookie also works on an http:// development origin.
 * A production gateway (`useSecureCookies`, on whenever `NODE_ENV=production`)
 * reads ONLY the `__Secure-` prefixed name, so a request that carries just the
 * unprefixed cookie is treated as signed out and answered 401 immediately, with
 * no session lookup. A development gateway reads the unprefixed name.
 *
 * Emitting both names with the same value is correct against either gateway: the
 * one it does not read is ignored. Every code path that forwards a browser
 * cookie header to the gateway MUST go through this function. It was previously
 * copy-pasted into two modules and missing from a third (the server-rendered
 * loaders' API client), which showed as "Your session has ended" straight after
 * a successful login on any production gateway while local development worked.
 *
 * Pure and dependency-free so it is safe to import from any runtime.
 */
export const SESSION_COOKIE_NAME = 'better-auth.session_token';
export const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`;

export function withGatewaySessionCookieName(cookieHeader: string): string {
  if (cookieHeader.includes(`${SECURE_SESSION_COOKIE_NAME}=`)) {
    return cookieHeader;
  }
  const match = /(?:^|;)\s*better-auth\.session_token=([^;]+)/.exec(cookieHeader);
  const value = match?.[1];
  if (value === undefined) {
    return cookieHeader;
  }
  return `${cookieHeader}; ${SECURE_SESSION_COOKIE_NAME}=${value}`;
}

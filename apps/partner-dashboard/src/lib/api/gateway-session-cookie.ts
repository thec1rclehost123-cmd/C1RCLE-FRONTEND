/**
 * The frontend stores the Better-Auth session cookie under the unprefixed name
 * (`better-auth.session_token`, see `rescopeSessionCookies` in the BFF proxy). A
 * production gateway (`useSecureCookies`, on whenever `NODE_ENV=production`)
 * reads ONLY the `__Secure-` prefixed name, so a request that carries just the
 * unprefixed cookie is treated as signed out and answered 401 straight away.
 *
 * Emit both names with the same value so the gateway resolves the session
 * whichever name it is configured for; the one it does not read is ignored.
 *
 * Pure and dependency-free on purpose: the server-side API client uses it, and
 * so can anything that forwards a browser cookie header to the gateway.
 */
const SESSION_COOKIE_NAME = 'better-auth.session_token';
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`;

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

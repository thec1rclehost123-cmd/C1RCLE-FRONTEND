const SERVER_AUTHORIZED_EVENT_SUBROUTES = new Set(['analytics', 'sales', 'guests', 'promoters']);

/**
 * These event screens fetch their page data in a server component through the
 * gateway, which enforces the current session, organization membership, and
 * route permission before returning the data. Let that server-authorized page
 * render while the client-only session/organization UI finishes hydrating.
 */
export function isServerAuthorizedPartnerEventRoute(pathname: string | null): boolean {
  if (pathname === null) return false;

  const segments = pathname.split('/').filter(Boolean);
  if (
    segments.length !== 4 &&
    !(segments.length === 5 && SERVER_AUTHORIZED_EVENT_SUBROUTES.has(segments[4] ?? ''))
  ) {
    return false;
  }

  return (
    segments[0] === 'partner' &&
    (segments[1] === 'venue' || segments[1] === 'host') &&
    segments[2] === 'events' &&
    Boolean(segments[3]) &&
    segments[3] !== 'create' &&
    segments[3] !== 'new'
  );
}

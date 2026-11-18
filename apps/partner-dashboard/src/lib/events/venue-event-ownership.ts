import 'server-only';

import { loadVenueEventDetail } from '@/lib/events/load-venue-event-detail';

/**
 * Whether the event is owned by the Venue itself. A Venue owns its own events,
 * so it gets the full event workspace for them. Events owned by a Host stay in
 * the read-only operational view, because the Venue must not see Host revenue
 * or attendee identities.
 */
export async function isVenueOwnedEvent(eventId: string): Promise<boolean> {
  const record = await loadVenueEventDetail(eventId).catch(() => null);
  return record?.event.ownerType === 'venue';
}

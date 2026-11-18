import { notFound } from 'next/navigation';

import { ConnectedEventGuestsScreen } from '@/components/partner-v3/event-detail/ConnectedEventGuestsScreen';
import { VenueEventReadOnlySection } from '@/components/venue/event-detail/VenueEventReadOnlySection';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventGuests } from '@/lib/events/load-partner-event-guests';
import { isVenueOwnedEvent } from '@/lib/events/venue-event-ownership';

export default async function StudioEventGuestsPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio === 'venue' && !(await isVenueOwnedEvent(eventId)))
    return (
      <VenueEventReadOnlySection
        title="Guest list unavailable"
        description="Venue Studio shows attendance totals and check-ins, not attendee identities."
      />
    );
  if (studio !== 'venue' && studio !== 'host') notFound();
  const [event, guestPage] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventGuests(eventId),
  ]);
  return (
    <ConnectedEventGuestsScreen
      studio={studio}
      eventId={eventId}
      eventTitle={event.title}
      guests={guestPage.items}
      truncated={guestPage.truncated}
    />
  );
}

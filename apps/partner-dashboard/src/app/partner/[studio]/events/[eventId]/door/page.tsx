import { notFound } from 'next/navigation';

import { ConnectedScannerScreen } from '@/components/partner-v3/door/ConnectedScannerScreen';
import { VenueEventReadOnlySection } from '@/components/venue/event-detail/VenueEventReadOnlySection';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { isVenueOwnedEvent } from '@/lib/events/venue-event-ownership';

export default async function StudioEventDoorPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio === 'venue' && !(await isVenueOwnedEvent(eventId)))
    return (
      <VenueEventReadOnlySection
        title="Door Mode unavailable"
        description="Scanning authorization is not configured for Venue operators. The Host manages ticket scanning."
      />
    );
  if (studio !== 'venue' && studio !== 'host') notFound();
  const event = await loadPartnerEvent(eventId);
  return (
    <ConnectedScannerScreen
      studio={studio}
      eventId={event.id}
      organizationId={event.organizationId}
      eventTitle={event.title}
      eventEndAt={event.endAt}
    />
  );
}

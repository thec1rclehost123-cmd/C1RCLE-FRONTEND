import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { ConnectedEventEditScreen } from '@/components/partner-v3/event-detail/ConnectedEventEditScreen';
import { VenueEventReadOnlySection } from '@/components/venue/event-detail/VenueEventReadOnlySection';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventTiers } from '@/lib/events/load-partner-event-tiers';
import { loadVenueEventDetail } from '@/lib/events/load-venue-event-detail';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export default async function StudioEventEditPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  if (studio === 'venue') {
    const venueRecord = await loadVenueEventDetail(eventId).catch(() => null);
    if (!venueRecord) notFound();
    if (venueRecord.event.ownerType === 'host') {
      return (
        <VenueEventReadOnlySection
          title="Host event is view only"
          description="This event belongs to the Host and can only be edited from Host Studio. The Venue operational view remains read only."
        />
      );
    }
  }
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  const [event, tiers] = await Promise.all([
    loadPartnerEvent(eventId),
    studio === 'host' ? loadPartnerEventTiers(eventId) : Promise.resolve([]),
  ]);
  if (!organizationId) notFound();
  return (
    <ConnectedEventEditScreen
      event={event}
      organizationId={organizationId}
      studio={studio}
      ticketTiers={tiers}
    />
  );
}

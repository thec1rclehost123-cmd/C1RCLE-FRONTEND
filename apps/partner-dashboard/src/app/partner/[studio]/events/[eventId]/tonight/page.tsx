import { notFound } from 'next/navigation';

import { ConnectedEventSectionUnavailable } from '@/components/partner-v3/event-detail/ConnectedEventSectionUnavailable';
import { VenueEventReadOnlySection } from '@/components/venue/event-detail/VenueEventReadOnlySection';

export default async function StudioEventTonightPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio === 'venue')
    return (
      <VenueEventReadOnlySection
        title="Event operations are view only"
        description="The Venue workspace shows event schedule, attendance totals, and check-ins without Host controls."
      />
    );
  if (studio !== 'host') notFound();
  return (
    <ConnectedEventSectionUnavailable
      studio={studio}
      eventId={eventId}
      section="Event operations"
    />
  );
}

import { notFound } from 'next/navigation';

import { ConnectedEventAccessScreen } from '@/components/partner-v3/event-detail/ConnectedEventAccessScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventAccess } from '@/lib/events/load-partner-event-access';

export default async function StudioEventAccessPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const [event, access] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventAccess(eventId),
  ]);
  return (
    <ConnectedEventAccessScreen
      studio={studio}
      eventId={eventId}
      eventTitle={event.title}
      eventVisibilityMode={event.visibilityMode}
      organizationId={access.organizationId}
      tiers={access.tiers}
      initialCodes={access.codes}
    />
  );
}

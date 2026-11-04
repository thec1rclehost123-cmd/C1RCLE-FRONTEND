import { notFound } from 'next/navigation';

import { ConnectedEventAddonsScreen } from '@/components/partner-v3/event-detail/ConnectedEventAddonsScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventAddons } from '@/lib/events/load-partner-event-addons';

export default async function StudioEventAddonsPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const [event, catalog] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventAddons(eventId),
  ]);
  return (
    <ConnectedEventAddonsScreen
      studio={studio}
      eventId={eventId}
      eventTitle={event.title}
      organizationId={catalog.organizationId}
      initialAddons={catalog.addons}
    />
  );
}

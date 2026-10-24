import { notFound } from 'next/navigation';

import { ConnectedEventPromotersScreen } from '@/components/partner-v3/event-detail/ConnectedEventPromotersScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventPromoters } from '@/lib/events/load-partner-event-promoters';

export default async function StudioEventPromotersPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const [event, links] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventPromoters(eventId),
  ]);
  return (
    <ConnectedEventPromotersScreen
      studio={studio}
      eventId={eventId}
      eventTitle={event.title}
      links={links}
    />
  );
}

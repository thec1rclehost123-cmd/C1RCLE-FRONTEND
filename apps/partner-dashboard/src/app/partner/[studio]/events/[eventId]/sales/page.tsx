import { notFound } from 'next/navigation';

import { ConnectedEventSalesScreen } from '@/components/partner-v3/event-detail/ConnectedEventSalesScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventSales } from '@/lib/events/load-partner-event-sales';

export default async function StudioEventSalesPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const [event, orders] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventSales(eventId),
  ]);
  return (
    <ConnectedEventSalesScreen
      studio={studio}
      eventId={eventId}
      eventTitle={event.title}
      orders={orders}
    />
  );
}

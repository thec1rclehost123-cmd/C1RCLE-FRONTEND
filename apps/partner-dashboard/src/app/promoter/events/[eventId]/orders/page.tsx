import { notFound } from 'next/navigation';

import { acceptedEvents, anonymousOrders } from '@/components/promoter/promoter-studio-model';
import {
  AnonymousOrdersTable,
  EmptyState,
  EventHero,
  PromoterPageHeader,
} from '@/components/promoter/PromoterStudioUi';

export default async function EventOrdersPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = acceptedEvents.find((item) => item.id === eventId);
  if (!event) notFound();
  const orders = anonymousOrders.filter((order) => order.eventId === event.id);
  return (
    <div className="pr-page pr-event-scope">
      <EventHero event={event} active="orders" />
      <PromoterPageHeader
        eyebrow="Private attribution"
        title="Attributed orders"
        description="Only order-level commercial data is shown. Guest names, email addresses and phone numbers are never exposed."
      />
      {orders.length ? (
        <AnonymousOrdersTable orders={orders} />
      ) : (
        <EmptyState
          title="No attributed orders yet"
          description="Orders completed through this event's permanent promoter link will appear here without attendee identity."
        />
      )}
    </div>
  );
}

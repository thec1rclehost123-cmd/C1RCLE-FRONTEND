import { notFound } from 'next/navigation';

import { ConnectedEventWaitlistScreen } from '@/components/partner-v3/event-detail/ConnectedEventWaitlistScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventWaitlist } from '@/lib/events/load-partner-event-waitlist';

export default async function StudioEventWaitlistPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const [event, waitlist] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventWaitlist(eventId),
  ]);
  return (
    <ConnectedEventWaitlistScreen
      studio={studio}
      eventId={event.id}
      eventTitle={event.title}
      organizationId={waitlist.organizationId}
      tiers={waitlist.tiers}
    />
  );
}

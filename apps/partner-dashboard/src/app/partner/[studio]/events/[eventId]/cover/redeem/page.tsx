import { notFound } from 'next/navigation';

import { ConnectedEventCoverRedemptionScreen } from '@/components/partner-v3/event-detail/ConnectedEventCoverRedemptionScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventCoverPolicy } from '@/lib/events/load-partner-event-cover-policy';

export default async function StudioEventCoverRedemptionPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue') notFound();
  const [event, policy] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventCoverPolicy(eventId),
  ]);
  return (
    <ConnectedEventCoverRedemptionScreen
      studio="venue"
      eventId={eventId}
      eventTitle={event.title}
      organizationId={policy.organizationId}
    />
  );
}

import { notFound } from 'next/navigation';

import { ConnectedEventCoverPolicyScreen } from '@/components/partner-v3/event-detail/ConnectedEventCoverPolicyScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventCoverPolicy } from '@/lib/events/load-partner-event-cover-policy';

export default async function StudioEventCoverPolicyPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const [event, policy] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventCoverPolicy(eventId),
  ]);
  return (
    <ConnectedEventCoverPolicyScreen
      studio={studio}
      eventId={eventId}
      eventTitle={event.title}
      organizationId={policy.organizationId}
      eventOrganizationId={event.organizationId}
      initialHistory={policy.history}
    />
  );
}

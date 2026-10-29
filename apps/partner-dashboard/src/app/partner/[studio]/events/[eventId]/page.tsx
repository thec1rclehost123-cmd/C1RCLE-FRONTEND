import { notFound } from 'next/navigation';

import { ConnectedPartnerEventScreen } from '@/components/partner-v3/event-detail/ConnectedPartnerEventScreen';
import { PromoterAssignmentDetailsScreen } from '@/components/promoter/PromoterAssignmentDetailsScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPromoterEvents } from '@/lib/events/load-promoter-events';

import { renderStudioSkeleton } from '../../route-helpers';

export default async function StudioEventDetailPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio === 'promoter') {
    const data = await loadPromoterEvents();
    const assignment = [...data.linkedEvents, ...data.invitations].find(
      (item) => item.id === eventId,
    );
    if (!assignment) notFound();
    return <PromoterAssignmentDetailsScreen event={assignment} links={data.referralLinks} />;
  }

  if (studio !== 'venue' && studio !== 'host')
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Event detail',
      'Event detail routes are reserved for a later screen implementation.',
    );

  const event = await loadPartnerEvent(eventId);
  return (
    <ConnectedPartnerEventScreen
      event={event}
      organizationId={event.organizationId}
      studio={studio}
    />
  );
}

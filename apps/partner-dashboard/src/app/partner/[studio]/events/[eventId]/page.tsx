import { ConnectedPartnerEventScreen } from '@/components/partner-v3/event-detail/ConnectedPartnerEventScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';

import { renderStudioSkeleton } from '../../route-helpers';

export default async function StudioEventDetailPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
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

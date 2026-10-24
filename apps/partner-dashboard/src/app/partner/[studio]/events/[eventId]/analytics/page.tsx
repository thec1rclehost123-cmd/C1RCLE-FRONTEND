import { ConnectedEventAnalyticsScreen } from '@/components/partner-v3/event-detail/ConnectedEventAnalyticsScreen';
import { loadPartnerEventAnalytics } from '@/lib/events/load-partner-event-analytics';

import { renderStudioSkeleton } from '../../../route-helpers';

export default async function StudioEventAnalyticsPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') {
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Event analytics',
      'Event analytics are unavailable for this workspace.',
    );
  }

  const analytics = await loadPartnerEventAnalytics(eventId);
  return <ConnectedEventAnalyticsScreen analytics={analytics} studio={studio} />;
}

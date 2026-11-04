import { notFound } from 'next/navigation';

import { ConnectedEventAnalyticsScreen } from '@/components/partner-v3/event-detail/ConnectedEventAnalyticsScreen';
import { PromoterAssignmentDetailsScreen } from '@/components/promoter/PromoterAssignmentDetailsScreen';
import { loadPartnerEventAnalytics } from '@/lib/events/load-partner-event-analytics';
import { loadPromoterEvents } from '@/lib/events/load-promoter-events';

import { renderStudioSkeleton } from '../../../route-helpers';

export default async function StudioEventAnalyticsPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio === 'promoter') {
    const data = await loadPromoterEvents();
    const event = [...data.linkedEvents, ...data.invitations].find((item) => item.id === eventId);
    if (!event) notFound();
    return (
      <PromoterAssignmentDetailsScreen
        event={event}
        links={data.referralLinks}
        activeTab="performance"
      />
    );
  }
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

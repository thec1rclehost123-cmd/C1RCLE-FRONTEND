import { notFound } from 'next/navigation';

import { ConnectedPartnerEventScreen } from '@/components/partner-v3/event-detail/ConnectedPartnerEventScreen';
import { PromoterAssignmentDetailsScreen } from '@/components/promoter/PromoterAssignmentDetailsScreen';
import { PromoterPublicEventDetailsScreen } from '@/components/promoter/PromoterPublicEventDetailsScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPartnerEventAnalytics } from '@/lib/events/load-partner-event-analytics';
import { loadPartnerEventTiers } from '@/lib/events/load-partner-event-tiers';
import { loadPromoterEventVenue, loadPromoterEvents } from '@/lib/events/load-promoter-events';

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
    if (assignment) {
      return <PromoterAssignmentDetailsScreen event={assignment} links={data.referralLinks} />;
    }
    const publicEvent = data.discoverEvents.find((item) => item.id === eventId);
    if (!publicEvent) notFound();
    const venue = publicEvent.venueId
      ? await loadPromoterEventVenue(publicEvent.venueId).catch(() => null)
      : null;
    return (
      <PromoterPublicEventDetailsScreen
        event={{
          ...publicEvent,
          venue: venue?.name ?? publicEvent.venue,
          city: venue?.city ?? publicEvent.city,
        }}
      />
    );
  }

  if (studio !== 'venue' && studio !== 'host')
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Event detail',
      'Event detail routes are reserved for a later screen implementation.',
    );

  const [event, analytics, tiers] = await Promise.all([
    loadPartnerEvent(eventId),
    loadPartnerEventAnalytics(eventId),
    loadPartnerEventTiers(eventId),
  ]);
  return (
    <ConnectedPartnerEventScreen
      event={event}
      analytics={analytics}
      tiers={tiers}
      organizationId={event.organizationId}
      studio={studio}
      showEventHeader={false}
    />
  );
}

import { notFound } from 'next/navigation';

import { ConnectedEventAnalyticsScreen } from '@/components/partner-v3/event-detail/ConnectedEventAnalyticsScreen';
import { PromoterAssignmentDetailsScreen } from '@/components/promoter/PromoterAssignmentDetailsScreen';
import { VenueEventReadOnlySection } from '@/components/venue/event-detail/VenueEventReadOnlySection';
import { loadPartnerEventAnalytics } from '@/lib/events/load-partner-event-analytics';
import { loadPartnerEventBookingHeatmap } from '@/lib/events/load-partner-event-booking-heatmap';
import { loadPartnerEventPromos } from '@/lib/events/load-partner-event-promos';
import { loadPromoterEvents } from '@/lib/events/load-promoter-events';

import { renderStudioSkeleton } from '../../../route-helpers';

export default async function StudioEventAnalyticsPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio === 'venue')
    return (
      <VenueEventReadOnlySection
        title="Venue operational analytics"
        description="Venue analytics summarize event counts, attendance, and capacity across the Venue workspace. Host revenue and settlement data are not available here."
      />
    );
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
  if (studio !== 'host') {
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Event analytics',
      'Event analytics are unavailable for this workspace.',
    );
  }

  const [analytics, bookingHeatmap, promoCodes] = await Promise.all([
    loadPartnerEventAnalytics(eventId),
    loadPartnerEventBookingHeatmap(eventId),
    loadPartnerEventPromos(eventId),
  ]);
  return (
    <ConnectedEventAnalyticsScreen
      analytics={analytics}
      bookingHeatmap={bookingHeatmap}
      promoCodes={promoCodes}
      studio="host"
    />
  );
}

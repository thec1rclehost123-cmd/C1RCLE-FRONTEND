import { notFound } from 'next/navigation';

import { parseEventSalesView } from '@/components/partner-v3/event-detail/EventSalesExperience';
import { HostEventSalesScreen } from '@/components/partner-v3/event-detail/HostEventSalesScreen';
import { VenueEventSalesScreen } from '@/components/partner-v3/event-detail/VenueEventSalesScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../../../route-helpers';

export default async function StudioEventSalesPage({ params, searchParams }: { readonly params: Promise<{ studio: string; eventId: string }>; readonly searchParams: Promise<{ view?: string | string[] }> }) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') return renderStudioSkeleton(Promise.resolve({ studio, eventId }), 'Event sales', 'Sales is reserved for Venue and Host Event Detail experiences.');

  const data = studio === 'host'
    ? await fixturePartnerDataSource.getHostEventDetail(eventId)
    : await fixturePartnerDataSource.getVenueEventDetail(eventId);
  if (!data) notFound();
  const query = await searchParams;
  const view = parseEventSalesView(query.view);
  return studio === 'host' ? <HostEventSalesScreen data={data} view={view} /> : <VenueEventSalesScreen data={data} view={view} />;
}

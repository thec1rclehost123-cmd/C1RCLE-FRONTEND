import { notFound } from 'next/navigation';

import { EventPromotersScreen } from '@/components/partner-v3/event-detail/EventPromotersScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../../../route-helpers';

export default async function StudioEventPromotersPage({ params, searchParams }: { readonly params: Promise<{ studio: string; eventId: string }>; readonly searchParams: Promise<{ search?: string | string[] }> }) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') return renderStudioSkeleton(Promise.resolve({ studio, eventId }), 'Event promoters', 'Promoter operations are reserved for Venue and Host Event Detail experiences.');
  const data = studio === 'host'
    ? await fixturePartnerDataSource.getHostEventDetail(eventId)
    : await fixturePartnerDataSource.getVenueEventDetail(eventId);
  if (!data) notFound();
  const query = await searchParams;
  const search = Array.isArray(query.search) ? query.search[0] ?? '' : query.search ?? '';
  const baseHref = `/partner/${studio}/events/${eventId}`;
  return <EventPromotersScreen data={data} search={search} config={{ accent: studio === 'host' ? 'lavender' : 'orange', detailHref: baseHref, doorHref: `/partner/${studio}/door`, eventsHref: `/partner/${studio}/events`, eventHref: `${baseHref}/promoters`, guestsHref: `${baseHref}/guests` }} />;
}

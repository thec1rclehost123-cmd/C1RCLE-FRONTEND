import { notFound } from 'next/navigation';

import { EventGuestsScreen, parseEventGuestFilter } from '@/components/partner-v3/event-detail/EventGuestsScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../../../route-helpers';

export default async function StudioEventGuestsPage({ params, searchParams }: { readonly params: Promise<{ studio: string; eventId: string }>; readonly searchParams: Promise<{ search?: string | string[]; filter?: string | string[]; tag?: string | string[] }> }) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') return renderStudioSkeleton(Promise.resolve({ studio, eventId }), 'Event guests', 'Guest operations are reserved for Venue and Host Event Detail experiences.');
  const data = studio === 'host'
    ? await fixturePartnerDataSource.getHostEventDetail(eventId)
    : await fixturePartnerDataSource.getVenueEventDetail(eventId);
  if (!data) notFound();
  const query = await searchParams;
  const search = Array.isArray(query.search) ? query.search[0] ?? '' : query.search ?? '';
  const tag = Array.isArray(query.tag) ? query.tag[0] ?? '' : query.tag ?? '';
  const baseHref = `/partner/${studio}/events/${eventId}`;
  return <EventGuestsScreen data={data} search={search} filter={parseEventGuestFilter(query.filter)} tag={tag} config={{ accent: studio === 'host' ? 'lavender' : 'orange', detailHref: baseHref, doorHref: `/partner/${studio}/door`, eventsHref: `/partner/${studio}/events`, eventHref: `${baseHref}/guests` }} />;
}

import { notFound } from 'next/navigation';

import { EventOperationsScreen } from '@/components/partner-v3/event-detail/EventOperationsScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../../../route-helpers';

export default async function StudioEventTonightPage({ params }: { readonly params: Promise<{ studio: string; eventId: string }> }) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') return renderStudioSkeleton(Promise.resolve({ studio, eventId }), 'Tonight', 'Tonight operations are reserved for Venue and Host Event Detail experiences.');
  const data = studio === 'host'
    ? await fixturePartnerDataSource.getHostEventDetail(eventId)
    : await fixturePartnerDataSource.getVenueEventDetail(eventId);
  if (!data) notFound();
  const baseHref = `/partner/${studio}/events/${eventId}`;
  return <EventOperationsScreen data={data} config={{ accent: studio === 'host' ? 'lavender' : 'orange', detailHref: baseHref, doorHref: `/partner/${studio}/door`, eventsHref: `/partner/${studio}/events`, eventHref: `${baseHref}/tonight` }} />;
}

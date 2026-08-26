import { notFound } from 'next/navigation';

import { HostEventDetailScreen } from '@/components/partner-v3/event-detail/HostEventDetailScreen';
import { VenueEventDetailScreen } from '@/components/partner-v3/event-detail/VenueEventDetailScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../../route-helpers';

export default async function StudioEventDetailPage({ params }: { readonly params: Promise<{ studio: string; eventId: string }> }) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') return renderStudioSkeleton(Promise.resolve({ studio }), 'Event detail', 'Event detail routes are reserved for a later screen implementation.');

  const data = studio === 'host'
    ? await fixturePartnerDataSource.getHostEventDetail(eventId)
    : await fixturePartnerDataSource.getVenueEventDetail(eventId);
  if (!data) notFound();
  return studio === 'host' ? <HostEventDetailScreen data={data} /> : <VenueEventDetailScreen data={data} />;
}

import { notFound } from 'next/navigation';

import { VenueLiveEventSummaryScreen } from '@/components/venue/screens/VenueLiveEventSummaryScreen';
import { loadVenueEventDetail } from '@/lib/events/load-venue-event-detail';

export async function VenueEventSummaryPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const record = await loadVenueEventDetail(eventId).catch(() => null);
  if (!record) notFound();

  return <VenueLiveEventSummaryScreen record={record} />;
}

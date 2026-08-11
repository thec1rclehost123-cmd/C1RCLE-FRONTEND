import { notFound } from 'next/navigation';

import { getVenueEventDetailRecord } from '@/components/venue/event-detail-model';
import { VenueEventSummaryScreen } from '@/components/venue/screens/VenueEventSummaryScreen';

export default async function VenueEventSummaryPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const model = getVenueEventDetailRecord(eventId)?.summary;
  if (model === undefined) notFound();

  return <VenueEventSummaryScreen eventId={eventId} model={model} />;
}

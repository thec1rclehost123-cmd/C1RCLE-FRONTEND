import { notFound } from 'next/navigation';

import { getVenueEventDetailRecord } from '@/components/venue/event-detail-model';
import { VenueEventGuestsScreen } from '@/components/venue/screens/VenueEventGuestsScreen';

export default async function VenueEventGuestsPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const model = getVenueEventDetailRecord(eventId)?.guests;
  if (model === undefined) notFound();

  return <VenueEventGuestsScreen model={model} />;
}

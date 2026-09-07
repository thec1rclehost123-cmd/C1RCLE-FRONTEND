import { notFound } from 'next/navigation';

import { getVenueEventDetailRecord } from '@/components/venue/event-detail-model';
import { VenueEventPromotersScreen } from '@/components/venue/screens/VenueEventPromotersScreen';

export default async function VenueEventPromotersPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const model = getVenueEventDetailRecord(eventId)?.promoters;
  if (model === undefined) notFound();

  return <VenueEventPromotersScreen model={model} />;
}

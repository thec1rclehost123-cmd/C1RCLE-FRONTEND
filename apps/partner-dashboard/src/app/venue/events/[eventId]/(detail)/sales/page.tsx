import { notFound } from 'next/navigation';

import { getVenueEventDetailRecord } from '@/components/venue/event-detail-model';
import { VenueEventSalesScreen } from '@/components/venue/screens/VenueEventSalesScreen';

export default async function VenueEventSalesPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const model = getVenueEventDetailRecord(eventId)?.sales;
  if (model === undefined) notFound();

  return <VenueEventSalesScreen model={model} />;
}

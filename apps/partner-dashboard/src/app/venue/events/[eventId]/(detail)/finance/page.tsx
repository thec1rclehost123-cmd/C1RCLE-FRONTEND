import { notFound } from 'next/navigation';

import { getVenueEventDetailRecord } from '@/components/venue/event-detail-model';
import { VenueEventFinanceScreen } from '@/components/venue/screens/VenueEventFinanceScreen';

export default async function VenueEventFinancePage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const model = getVenueEventDetailRecord(eventId)?.finance;
  if (model === undefined) notFound();

  return <VenueEventFinanceScreen model={model} />;
}

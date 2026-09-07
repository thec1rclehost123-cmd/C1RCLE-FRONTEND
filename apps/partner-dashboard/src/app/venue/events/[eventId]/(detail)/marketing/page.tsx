import { notFound } from 'next/navigation';

import { getVenueEventDetailRecord } from '@/components/venue/event-detail-model';
import { VenueEventMarketingScreen } from '@/components/venue/screens/VenueEventMarketingScreen';

export default async function VenueEventMarketingPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const model = getVenueEventDetailRecord(eventId)?.marketing;
  if (model === undefined) notFound();

  return <VenueEventMarketingScreen model={model} />;
}

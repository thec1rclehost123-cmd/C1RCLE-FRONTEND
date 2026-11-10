import { notFound } from 'next/navigation';

import { LiveEventCompareScreen } from '@/components/partner-v3/event-detail/LiveEventCompareScreen';
import { loadPartnerEventComparison } from '@/lib/events/load-partner-event-comparison';

export default async function StudioEventComparePage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const data = await loadPartnerEventComparison(eventId);
  return <LiveEventCompareScreen data={data} />;
}

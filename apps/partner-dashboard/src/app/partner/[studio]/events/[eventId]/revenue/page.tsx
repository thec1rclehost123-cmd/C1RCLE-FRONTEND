import { notFound } from 'next/navigation';

import { ConnectedEventRevenueScreen } from '@/components/partner-v3/event-detail/ConnectedEventRevenueScreen';
import { loadPartnerEventAnalytics } from '@/lib/events/load-partner-event-analytics';

export default async function StudioEventRevenuePage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const analytics = await loadPartnerEventAnalytics(eventId);
  return <ConnectedEventRevenueScreen analytics={analytics} />;
}

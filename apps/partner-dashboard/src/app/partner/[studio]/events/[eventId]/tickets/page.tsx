import { notFound } from 'next/navigation';

import { ConnectedEventTicketsScreen } from '@/components/partner-v3/event-detail/ConnectedEventTicketsScreen';
import { loadPartnerEventTiers } from '@/lib/events/load-partner-event-tiers';

export default async function StudioEventTicketsPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const tiers = await loadPartnerEventTiers(eventId);
  return <ConnectedEventTicketsScreen tiers={tiers} />;
}

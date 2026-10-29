import { notFound } from 'next/navigation';

import { ConnectedScannerScreen } from '@/components/partner-v3/door/ConnectedScannerScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';

export default async function StudioEventDoorPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const event = await loadPartnerEvent(eventId);
  return (
    <ConnectedScannerScreen
      studio={studio}
      eventId={event.id}
      organizationId={event.organizationId}
      eventTitle={event.title}
    />
  );
}

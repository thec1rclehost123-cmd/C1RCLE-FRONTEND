import { notFound } from 'next/navigation';

import { ConnectedEventSectionUnavailable } from '@/components/partner-v3/event-detail/ConnectedEventSectionUnavailable';

export default async function StudioEventTonightPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  return (
    <ConnectedEventSectionUnavailable
      studio={studio}
      eventId={eventId}
      section="Event operations"
    />
  );
}

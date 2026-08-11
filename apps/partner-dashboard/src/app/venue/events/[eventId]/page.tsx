import { notFound } from 'next/navigation';

import { EVENTS } from '@/components/venue/data';
import { EventDetailScreen } from '@/components/venue/screens/EventDetailScreen';

export default async function VenueEventPage({ params }: { readonly params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const exists = EVENTS.some((event) => event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === eventId);
  if (!exists) notFound();
  return <EventDetailScreen eventId={eventId} />;
}

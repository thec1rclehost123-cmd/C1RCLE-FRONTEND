import { notFound } from 'next/navigation';

import { EventDetailLayout } from '@/components/venue/event-detail/EventDetailLayout';
import { loadVenueEventDetail } from '@/lib/events/load-venue-event-detail';

import type { ReactNode } from 'react';

export default async function VenueEventDetailLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const record = await loadVenueEventDetail(eventId).catch(() => null);
  if (!record) notFound();
  const { event } = record;
  const dateTime = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  return (
    <EventDetailLayout
      event={{
        id: event.id,
        name: event.title,
        venue: event.venueId ?? event.externalLocation?.name ?? 'Venue not specified',
        dateTimeLabel: `${dateTime.format(new Date(event.startAt))}${event.endAt ? ` – ${dateTime.format(new Date(event.endAt))}` : ''} IST`,
        posterSrc: event.imageUrl ?? '/c1rcle-logo.webp',
        posterAlt: `${event.title} poster`,
        statusLabel: event.status.replaceAll('_', ' '),
        statusTone:
          event.status === 'published' || event.status === 'started' ? 'success' : 'neutral',
        roleLabel: 'Host event',
      }}
    >
      {children}
    </EventDetailLayout>
  );
}

import { notFound } from 'next/navigation';

import { EventWorkspaceChrome } from '@/components/partner-v3/event-detail/EventWorkspaceChrome';
import { loadVenueEventDetail } from '@/lib/events/load-venue-event-detail';

import type { EventWorkspaceModel } from '@/components/partner-v3/event-detail/EventWorkspaceChrome';
import type { ReactNode } from 'react';

export async function VenueEventDetailLayout({
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
  const formatPrice = (value: number | null) =>
    event.isFree
      ? 'Free'
      : value === null
        ? 'No active price'
        : new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
          }).format(value / 100);
  const workspaceEvent: EventWorkspaceModel = {
    id: event.id,
    ownerType: event.ownerType,
    title: event.title,
    venue: event.venueName,
    dateTime: `${dateTime.format(new Date(event.startAt))}${event.endAt ? ` – ${dateTime.format(new Date(event.endAt))}` : ''} IST`,
    statusLabel: event.status.replaceAll('_', ' '),
    contextLabel:
      event.ownerType === 'host'
        ? `Hosted by ${event.hostName ?? 'Host name unavailable'} · View only`
        : 'Venue-owned event',
    artwork: event.imageUrl
      ? { type: 'image', value: event.imageUrl, alt: `${event.title} poster` }
      : { type: 'gradient', value: 'placeholder' },
    metrics: [
      {
        label: 'Physical Venue capacity',
        value: event.venueCapacity?.toLocaleString('en-IN') ?? 'Not set',
      },
      { label: 'Event capacity', value: event.eventCapacity?.toLocaleString('en-IN') ?? 'Not set' },
      { label: 'Current from', value: formatPrice(event.currentStartingPricePaise) },
      { label: 'Base price', value: formatPrice(event.baseStartingPricePaise) },
    ],
  };

  return (
    <EventWorkspaceChrome
      studio="venue"
      event={workspaceEvent}
      tabs={[{ label: 'Overview', href: `/partner/venue/events/${encodeURIComponent(event.id)}` }]}
    >
      {children}
    </EventWorkspaceChrome>
  );
}

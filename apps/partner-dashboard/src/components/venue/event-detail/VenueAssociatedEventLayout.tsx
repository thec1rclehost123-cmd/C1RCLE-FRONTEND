import { notFound } from 'next/navigation';

import { EventWorkspaceChrome } from '@/components/partner-v3/event-detail/EventWorkspaceChrome';
import { VenueEventWorkspaceActions } from '@/components/venue/event-detail/VenueEventWorkspaceActions';
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
  const { event, tiers, hostName, venueName } = record;
  const dateTime = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
  const startingPrice = tiers.length
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: tiers[0]?.currency ?? 'INR',
        maximumFractionDigits: 2,
      }).format(Math.min(...tiers.map((tier) => tier.priceInPaise)) / 100)
    : 'Not available';
  const workspaceEvent: EventWorkspaceModel = {
    id: event.id,
    title: event.title,
    venue: venueName ?? event.externalLocation?.name ?? 'Venue name unavailable',
    dateTime: `${dateTime.format(new Date(event.startAt))}${event.endAt ? ` – ${dateTime.format(new Date(event.endAt))}` : ''} IST`,
    statusLabel: event.status.replaceAll('_', ' '),
    contextLabel: `Hosted by ${hostName ?? 'Host name unavailable'}`,
    artwork: event.imageUrl
      ? { type: 'image', value: event.imageUrl, alt: `${event.title} poster` }
      : { type: 'gradient', value: 'placeholder' },
    metrics: [
      { label: 'Host', value: hostName ?? 'Host name unavailable' },
      { label: 'Ticket tiers', value: String(tiers.length) },
      { label: 'Starting price', value: startingPrice },
    ],
  };

  return (
    <EventWorkspaceChrome
      studio="venue"
      event={workspaceEvent}
      tabs={[{ label: 'Overview', href: `/partner/venue/events/${encodeURIComponent(event.id)}` }]}
      actions={<VenueEventWorkspaceActions eventId={event.id} />}
    >
      {children}
    </EventWorkspaceChrome>
  );
}

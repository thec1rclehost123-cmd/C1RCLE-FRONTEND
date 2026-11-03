import { notFound } from 'next/navigation';

import { EventWorkspaceChrome } from '@/components/partner-v3/event-detail/EventWorkspaceChrome';
import { formatProductDateTime } from '@/lib/events/event-time';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { loadPromoterEvents } from '@/lib/events/load-promoter-events';

import type {
  EventWorkspaceModel,
  EventWorkspaceTab,
} from '@/components/partner-v3/event-detail/EventWorkspaceChrome';
import type { PromoterLinkedEvent } from '@/data/partner-data-source';
import type { ReactNode } from 'react';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function eventTabs(studio: 'venue' | 'host', eventId: string): EventWorkspaceTab[] {
  const base = `/partner/${studio}/events/${encodeURIComponent(eventId)}`;
  return [
    { label: 'Overview', href: base },
    { label: 'Analytics', href: `${base}/analytics` },
    { label: 'Attendees', href: `${base}/guests` },
    { label: 'Tickets', href: `${base}/tickets` },
    { label: 'Orders', href: `${base}/sales` },
    { label: 'Extras', href: `${base}/addons` },
    { label: 'Waitlist', href: `${base}/waitlist` },
    { label: 'Promoters', href: `${base}/promoters` },
    { label: 'Access', href: `${base}/access` },
    { label: 'Door', href: `${base}/door` },
    { label: 'Cover', href: `${base}/cover` },
  ];
}

function promoterTabs(eventId: string): EventWorkspaceTab[] {
  const base = `/partner/promoter/events/${encodeURIComponent(eventId)}`;
  return [
    { label: 'Overview', href: base },
    { label: 'Performance', href: `${base}/analytics` },
    { label: 'Referral links', href: `${base}/referrals` },
    { label: 'Assignment terms', href: `${base}/terms` },
  ];
}

function promoterEventModel(event: PromoterLinkedEvent): EventWorkspaceModel {
  return {
    id: event.id,
    title: event.name,
    venue: event.venue,
    dateTime: event.eventDateTime ?? 'Event date unavailable',
    statusLabel: event.eventStatus ?? 'Event status unavailable',
    contextLabel: `Assignment: ${event.assignmentStatus ?? 'status unavailable'}`,
    artwork: event.artwork,
    metrics: [
      { label: 'Referral clicks', value: event.clicks?.toLocaleString('en-IN') ?? '—' },
      { label: 'Attributed sales', value: event.sales?.toLocaleString('en-IN') ?? '—' },
      { label: 'Commission', value: event.commissionLabel ?? 'Terms unavailable' },
    ],
  };
}

export default async function EventWorkspaceLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;

  if (studio === 'promoter') {
    const data = await loadPromoterEvents();
    const assignment = [...data.linkedEvents, ...data.invitations].find(
      (item) => item.id === eventId,
    );
    if (assignment) {
      return (
        <EventWorkspaceChrome
          studio="promoter"
          event={promoterEventModel(assignment)}
          tabs={promoterTabs(eventId)}
        >
          {children}
        </EventWorkspaceChrome>
      );
    }
    const publicEvent = data.discoverEvents.find((item) => item.id === eventId);
    if (!publicEvent) notFound();
    const event: EventWorkspaceModel = {
      id: publicEvent.id,
      title: publicEvent.name,
      venue: publicEvent.venue,
      dateTime: `${publicEvent.dateLabel} · ${publicEvent.timeLabel} IST`,
      statusLabel: publicEvent.eventStatus ?? 'Public listing',
      artwork: publicEvent.artwork,
      metrics: [{ label: 'Listing', value: 'Public event' }],
    };
    return (
      <EventWorkspaceChrome
        studio="promoter"
        event={event}
        tabs={[
          { label: 'Overview', href: `/partner/promoter/events/${encodeURIComponent(eventId)}` },
        ]}
      >
        {children}
      </EventWorkspaceChrome>
    );
  }

  if (studio !== 'host' && studio !== 'venue') notFound();
  const event = await loadPartnerEvent(eventId);
  const workspaceEvent: EventWorkspaceModel = {
    id: event.id,
    title: event.title,
    venue: event.venueName ?? (event.venueId ? 'Venue name unavailable' : 'Venue not specified'),
    dateTime: formatProductDateTime(event.startAt),
    statusLabel:
      event.status === 'published' || event.status === 'started'
        ? 'Live'
        : event.status === 'draft'
          ? 'Draft'
          : event.status === 'review'
            ? 'Review'
            : event.status === 'scheduled'
              ? 'Scheduled'
              : event.status === 'sales_paused'
                ? 'Paused'
                : event.status === 'ended'
                  ? 'Past'
                  : event.status === 'archived'
                    ? 'Archived'
                    : 'Cancelled',
    artwork: event.imageUrl
      ? { type: 'image', value: event.imageUrl, alt: event.title }
      : { type: 'gradient', value: 'placeholder' },
    metrics: [
      {
        label: 'Tickets sold',
        value: event.salesCountComplete
          ? event.ticketsSold.toLocaleString('en-IN')
          : `At least ${event.ticketsSold.toLocaleString('en-IN')}`,
      },
      { label: 'Capacity', value: event.capacity?.toLocaleString('en-IN') ?? 'Not set' },
      {
        label: 'Starting price',
        value: event.isFree
          ? 'Free'
          : event.startingPricePaise === null
            ? 'Unavailable'
            : money.format(event.startingPricePaise / 100),
      },
    ],
  };

  return (
    <EventWorkspaceChrome studio={studio} event={workspaceEvent} tabs={eventTabs(studio, eventId)}>
      {children}
    </EventWorkspaceChrome>
  );
}

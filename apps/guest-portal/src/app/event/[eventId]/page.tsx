import { notFound } from 'next/navigation';

import { createApiClient } from '@c1rcle/api-client';
import { eventDtoSchema, hostPublicDtoSchema, venueDtoSchema } from '@c1rcle/contracts';

import { EventDetailView } from '@/features/event-detail/components/EventDetailView';
import { toEventDetailFixture } from '@/features/event-detail/event-detail-mapping';

import type { EventDetailFixture } from '@/features/event-detail/types/event-detail.types';
import type { Metadata } from 'next';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Real published events only — `GET /api/v2/public/events/:idOrSlug` 404s
 * drafts, review, scheduled, ended, archived, and cancelled events, so no
 * dummy content can reach this page. Venue/host names resolve through the
 * public by-id lookups; a missing venue/host renders honest placeholders.
 */
async function getEventDetail(eventId: string): Promise<EventDetailFixture | null> {
  const client = createApiClient();

  let event;
  try {
    event = await client.get({
      path: `/api/v2/public/events/${encodeURIComponent(eventId)}`,
      schema: eventDtoSchema,
    });
  } catch {
    return null;
  }

  const [venue, host] = await Promise.all([
    event.venueId
      ? client
          .get({
            path: `/api/v2/public/venues/by-id/${event.venueId}`,
            schema: venueDtoSchema,
          })
          .catch(() => null)
      : null,
    client
      .get({
        path: `/api/v2/public/hosts/by-id/${event.organizationId}`,
        schema: hostPublicDtoSchema,
      })
      .catch(() => null),
  ]);

  return toEventDetailFixture(event, venue, host);
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEventDetail(decodeURIComponent(eventId));
  if (!event) {
    return {
      title: 'Event unavailable | THE C1RCLE',
      description: 'This C1RCLE event is unavailable or has been removed.',
      robots: { index: false, follow: false },
    };
  }
  const canonical = `https://thec1rcle.com/event/${encodeURIComponent(event.slug)}`;
  return {
    title: `${event.title} | THE C1RCLE`,
    description: event.summary,
    alternates: { canonical },
    robots: { index: false, follow: false },
    openGraph: {
      title: event.title,
      description: event.summary,
      type: 'website',
      url: canonical,
      images: [{ url: event.image, alt: event.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.summary,
      images: [event.image],
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const event = await getEventDetail(decodeURIComponent(eventId));
  if (!event) notFound();
  return <EventDetailView event={event} />;
}

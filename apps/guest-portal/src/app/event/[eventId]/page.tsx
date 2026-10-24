import { notFound } from 'next/navigation';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import { eventPublicDetailDtoSchema, publicTicketTierListResponseSchema } from '@c1rcle/contracts';

import { EventDetailView } from '@/features/event-detail/components/EventDetailView';
import { toEventDetailFixture } from '@/features/event-detail/event-detail-mapping';
import { loadExploreEvents } from '@/features/explore/explore-data';

import type { EventDetailFixture } from '@/features/event-detail/types/event-detail.types';
import type { Metadata } from 'next';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

type EventDetailResult =
  { kind: 'ready'; event: EventDetailFixture } | { kind: 'not-found' } | { kind: 'unavailable' };

/** Public relationships and tiers are resolved by authoritative backend projections. */
async function getEventDetail(eventId: string): Promise<EventDetailResult> {
  const client = createApiClient({ maxRetries: 1, timeoutMs: 5_000 });
  const encoded = encodeURIComponent(eventId);
  let event;
  try {
    event = await client.get({
      path: `/api/v2/public/events/${encoded}`,
      schema: eventPublicDetailDtoSchema,
    });
  } catch (error) {
    return isApiClientError(error) && error.status === 404
      ? { kind: 'not-found' }
      : { kind: 'unavailable' };
  }

  try {
    const tiers = await client.get({
      path: `/api/v2/public/events/${encoded}/tiers`,
      schema: publicTicketTierListResponseSchema,
    });
    return { kind: 'ready', event: toEventDetailFixture(event, tiers.items) };
  } catch {
    return { kind: 'unavailable' };
  }
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const result = await getEventDetail(decodeURIComponent(eventId));
  if (result.kind === 'not-found') notFound();
  if (result.kind === 'unavailable') {
    return {
      title: 'Event temporarily unavailable | THE C1RCLE',
      description: 'Current event details could not be loaded.',
      robots: { index: false, follow: false },
    };
  }
  const { event } = result;
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
  const result = await getEventDetail(decodeURIComponent(eventId));
  if (result.kind === 'not-found') notFound();
  if (result.kind === 'unavailable') {
    return (
      <section className="relative z-10 mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-6 py-32 text-center text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6842]">
          Event details
        </p>
        <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
          Event temporarily unavailable
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-white/50">
          We could not confirm the current event or ticket availability. Refresh to try again.
        </p>
      </section>
    );
  }
  const recommendations = await loadExploreEvents()
    .then((events) => events.filter((event) => event.id !== result.event.id).slice(0, 8))
    .catch(() => []);
  return <EventDetailView event={result.event} recommendations={recommendations} />;
}

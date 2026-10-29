import { notFound } from 'next/navigation';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import { eventPublicDetailDtoSchema, publicTicketTierListResponseSchema } from '@c1rcle/contracts';

import { toBookingEventFromPublicDetail } from '@/features/booking/booking-mapping';
import { EventDetailView } from '@/features/event-detail/components/EventDetailView';
import { PrivateTierUnlockClient } from '@/features/event-detail/components/PrivateTierUnlockClient';
import { PromoterClickTracker } from '@/features/event-detail/components/PromoterClickTracker';
import { toEventDetailFixture } from '@/features/event-detail/event-detail-mapping';
import { loadExploreEvents } from '@/features/explore/explore-data';

import type { BookingEventFixture } from '@/features/booking/types/booking.types';
import type { EventDetailFixture } from '@/features/event-detail/types/event-detail.types';
import type { Metadata } from 'next';

export const revalidate = 0;

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ ref?: string | string[] }>;
}

type EventDetailResult =
  | { kind: 'ready'; event: EventDetailFixture; checkoutEvent: BookingEventFixture }
  | { kind: 'private' }
  | { kind: 'not-found' }
  | { kind: 'unavailable' };

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
      ? { kind: 'private' }
      : { kind: 'unavailable' };
  }

  try {
    const tiers = await client.get({
      path: `/api/v2/public/events/${encoded}/tiers`,
      schema: publicTicketTierListResponseSchema,
    });
    return {
      kind: 'ready',
      event: toEventDetailFixture(event, tiers.items),
      checkoutEvent: toBookingEventFromPublicDetail(event, tiers.items),
    };
  } catch {
    return { kind: 'unavailable' };
  }
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const result = await getEventDetail(decodeURIComponent(eventId));
  if (result.kind === 'not-found') notFound();
  if (result.kind === 'private') {
    return {
      title: 'Private event access | THE C1RCLE',
      description: 'Enter an event access code or invitation to continue.',
      robots: { index: false, follow: false, noarchive: true },
    };
  }
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

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const { eventId } = await params;
  const result = await getEventDetail(decodeURIComponent(eventId));
  if (result.kind === 'not-found') notFound();
  if (result.kind === 'private') {
    return (
      <section className="relative z-10 mx-auto flex min-h-[75vh] max-w-2xl flex-col justify-center px-6 py-24 text-white">
        <h1 className="text-3xl font-black uppercase">Private event access</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Enter an event access code or invitation secret. Event details appear only after your
          verified account is authorized.
        </p>
        <div className="mt-6">
          <PrivateTierUnlockClient eventId={decodeURIComponent(eventId)} accentTone="orange" />
        </div>
      </section>
    );
  }
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
  const query = (await searchParams) ?? {};
  const referralCode = typeof query.ref === 'string' ? query.ref : undefined;
  return (
    <>
      <PromoterClickTracker
        eventSlug={result.event.slug}
        {...(referralCode ? { code: referralCode } : {})}
      />
      <EventDetailView
        event={result.event}
        checkoutEvent={result.checkoutEvent}
        recommendations={recommendations}
        {...(referralCode ? { referralCode } : {})}
      />
    </>
  );
}

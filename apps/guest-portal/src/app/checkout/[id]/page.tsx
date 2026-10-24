import { notFound } from 'next/navigation';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import {
  eventDtoSchema,
  publicTicketTierListResponseSchema,
  venueDtoSchema,
} from '@c1rcle/contracts';

import { toBookingEventFixture } from '@/features/booking/booking-mapping';
import { CheckoutView } from '@/features/booking/components/CheckoutView';

import type { BookingEventFixture } from '@/features/booking/types/booking.types';
import type { Metadata } from 'next';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Checkout has one source of truth: the public event and tier APIs. Missing
 * events are 404s; transport/schema failures render an explicit unavailable
 * state. A tier-feed failure must never be disguised as an empty or synthetic
 * catalog because those ids and prices are payment inputs.
 */
type CheckoutEventResult =
  { kind: 'ready'; event: BookingEventFixture } | { kind: 'not-found' } | { kind: 'unavailable' };

async function getCheckoutEvent(id: string): Promise<CheckoutEventResult> {
  const decoded = decodeURIComponent(id);
  const client = createApiClient();
  let event;
  try {
    event = await client.get({
      path: `/api/v2/public/events/${encodeURIComponent(decoded)}`,
      schema: eventDtoSchema,
    });
  } catch (error) {
    return isApiClientError(error) && error.status === 404
      ? { kind: 'not-found' }
      : { kind: 'unavailable' };
  }

  const venue = event.venueId
    ? await client
        .get({
          path: `/api/v2/public/venues/by-id/${event.venueId}`,
          schema: venueDtoSchema,
        })
        .catch(() => null)
    : null;

  let tiers;
  try {
    tiers = await client.get({
      path: `/api/v2/public/events/${encodeURIComponent(decoded)}/tiers`,
      schema: publicTicketTierListResponseSchema,
    });
  } catch {
    return { kind: 'unavailable' };
  }

  return { kind: 'ready', event: toBookingEventFixture(event, venue, tiers.items) };
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getCheckoutEvent(id);
  const event = result.kind === 'ready' ? result.event : null;
  return {
    title: event ? `Checkout — ${event.title}` : 'Checkout unavailable',
    description: event ? `Checkout for ${event.title}.` : 'This checkout is unavailable.',
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params;
  const result = await getCheckoutEvent(id);
  if (result.kind === 'not-found') notFound();
  if (result.kind === 'unavailable') {
    return (
      <section className="relative z-10 mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-6 py-32 text-center text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6842]">
          Live availability
        </p>
        <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
          Checkout temporarily unavailable
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-white/50">
          We could not confirm current ticket inventory. Refresh to try again before paying.
        </p>
      </section>
    );
  }
  return <CheckoutView event={result.event} />;
}

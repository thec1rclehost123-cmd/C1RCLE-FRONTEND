import { notFound } from 'next/navigation';

import { createApiClient } from '@c1rcle/api-client';
import { eventDtoSchema, publicTicketTierListResponseSchema, venueDtoSchema } from '@c1rcle/contracts';

import { toBookingEventFixture } from '@/features/booking/booking-mapping';
import { CheckoutView } from '@/features/booking/components/CheckoutView';
import {
  findBookingEventFixture,
} from '@/features/booking/fixtures/booking.fixture';

import type { BookingEventFixture } from '@/features/booking/types/booking.types';
import type { Metadata } from 'next';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Fixture checkouts first (unchanged behavior), then real published events
 * mapped into the same UI — `GET /api/v2/public/events/:idOrSlug`
 * 404s anything unpublished, so no dummy content can reach this page. Venue
 * resolves through the public by-id lookup, tiers through the public tiers
 * listing (real ids the RSVP endpoint accepts); a tiers failure keeps the
 * previous price-derived fallback tier. Paid checkout stays a preview — only
 * free (₹0 total) bookings post a real RSVP from the client.
 */
async function getCheckoutEvent(id: string): Promise<BookingEventFixture | null> {
  const decoded = decodeURIComponent(id);
  const fixture = findBookingEventFixture(decoded);
  if (fixture) return fixture;

  const client = createApiClient();
  let event;
  try {
    event = await client.get({
      path: `/api/v2/public/events/${encodeURIComponent(decoded)}`,
      schema: eventDtoSchema,
    });
  } catch {
    return null;
  }

  const venue = event.venueId
    ? await client
        .get({
          path: `/api/v2/public/venues/by-id/${event.venueId}`,
          schema: venueDtoSchema,
        })
        .catch(() => null)
    : null;

  const tiers = await client
    .get({
      path: `/api/v2/public/events/${encodeURIComponent(decoded)}/tiers`,
      schema: publicTicketTierListResponseSchema,
    })
    .catch(() => null);

  return toBookingEventFixture(event, venue, tiers?.items ?? null);
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getCheckoutEvent(id);
  return {
    title: event ? `Checkout Preview — ${event.title}` : 'Checkout unavailable',
    description: event
      ? `Checkout preview for ${event.title}.`
      : 'This checkout preview is unavailable.',
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params;
  const event = await getCheckoutEvent(id);
  if (!event) notFound();
  return <CheckoutView event={event} />;
}

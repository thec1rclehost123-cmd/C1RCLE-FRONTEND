import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { createApiClient } from '@c1rcle/api-client';
import { eventDtoSchema, orderDtoSchema, venueDtoSchema } from '@c1rcle/contracts';

import { toBookingEventFixture } from '@/features/booking/booking-mapping';
import { ConfirmationView } from '@/features/booking/components/ConfirmationView';
import {
  bookingConfirmationFixtures,
  findBookingConfirmationFixture,
  findBookingEventFixture,
} from '@/features/booking/fixtures/booking.fixture';

import type {
  BookingConfirmationFixture,
  BookingEventFixture,
} from '@/features/booking/types/booking.types';
import type { Metadata } from 'next';

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return bookingConfirmationFixtures.map((confirmation) => ({ id: confirmation.id }));
}

export async function generateMetadata({ params }: ConfirmationPageProps): Promise<Metadata> {
  const { id } = await params;
  const fixture = findBookingConfirmationFixture(decodeURIComponent(id));
  return {
    title: fixture ? `Confirmation Preview — ${fixture.id}` : 'Booking confirmation',
    description: fixture
      ? 'Fixture-only booking confirmation and digital-pass presentation.'
      : 'Your booking confirmation and digital pass.',
    robots: { index: false, follow: false },
  };
}

/**
 * Real fulfilled orders (e.g. an RSVP just placed) render through the same
 * `ConfirmationView` as the fixtures. The order read is buyer-scoped and
 * cookie-authenticated, so strangers and logged-out guests land on `notFound`
 * — never on someone else's pass. The gateway asserts ownership (404, never
 * 403), and any transport failure maps to `notFound` here as well.
 */
async function getRealConfirmation(
  id: string,
): Promise<{ confirmation: BookingConfirmationFixture; event: BookingEventFixture } | null> {
  const cookieHeader = (await cookies())
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
  const client = createApiClient();
  const authed = cookieHeader.length > 0 ? { cookie: cookieHeader } : {};

  const order = await client
    .get({
      path: `/api/v2/orders/${encodeURIComponent(id)}`,
      schema: orderDtoSchema,
      headers: authed,
    })
    .catch(() => null);
  if (!order) return null;

  const event = await client
    .get({
      path: `/api/v2/public/events/${encodeURIComponent(order.eventId)}`,
      schema: eventDtoSchema,
    })
    .catch(() => null);
  if (!event) return null;

  const venue = event.venueId
    ? await client
        .get({
          path: `/api/v2/public/venues/by-id/${event.venueId}`,
          schema: venueDtoSchema,
        })
        .catch(() => null)
    : null;

  const line = order.lines[0];
  return {
    confirmation: {
      id: order.id,
      eventId: order.eventId,
      attendeeName: 'Guest',
      tierName: line?.tierName ?? 'Admission',
      quantity: order.lines.reduce((total, entry) => total + entry.quantity, 0),
      total: { amountPaise: order.grandTotalPaise, currency: 'INR' },
      referenceLabel: `RSVP-${order.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`,
    },
    event: toBookingEventFixture(event, venue),
  };
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);

  const fixtureConfirmation = findBookingConfirmationFixture(decoded);
  if (fixtureConfirmation) {
    const event = findBookingEventFixture(fixtureConfirmation.eventId);
    if (!event) notFound();
    return <ConfirmationView confirmation={fixtureConfirmation} event={event} />;
  }

  const real = await getRealConfirmation(decoded);
  if (!real) notFound();
  return <ConfirmationView confirmation={real.confirmation} event={real.event} />;
}

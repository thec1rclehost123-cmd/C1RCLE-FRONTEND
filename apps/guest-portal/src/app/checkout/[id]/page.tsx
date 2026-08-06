import { notFound } from 'next/navigation';

import { CheckoutView } from '@/features/booking/components/CheckoutView';
import {
  bookingEventFixtures,
  findBookingEventFixture,
} from '@/features/booking/fixtures/booking.fixture';

import type { Metadata } from 'next';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return bookingEventFixtures.map((event) => ({ id: event.id }));
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = findBookingEventFixture(decodeURIComponent(id));

  return {
    title: event ? `Checkout Preview — ${event.title}` : 'Checkout unavailable',
    description: event
      ? `Fixture-only checkout presentation for ${event.title}.`
      : 'This checkout preview is unavailable.',
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params;
  const event = findBookingEventFixture(decodeURIComponent(id));
  if (!event) notFound();

  return <CheckoutView event={event} />;
}

import { notFound } from 'next/navigation';

import { ConfirmationView } from '@/features/booking/components/ConfirmationView';
import {
  bookingConfirmationFixtures,
  findBookingConfirmationFixture,
  findBookingEventFixture,
} from '@/features/booking/fixtures/booking.fixture';

import type { Metadata } from 'next';

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return bookingConfirmationFixtures.map((confirmation) => ({ id: confirmation.id }));
}

export const metadata: Metadata = {
  title: 'Confirmation Preview',
  description: 'Fixture-only booking confirmation and digital-pass presentation.',
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const confirmation = findBookingConfirmationFixture(decodeURIComponent(id));
  if (!confirmation) notFound();

  const event = findBookingEventFixture(confirmation.eventId);
  if (!event) notFound();

  return <ConfirmationView confirmation={confirmation} event={event} />;
}

import { notFound } from 'next/navigation';

import { PrivateDataUnavailable } from '@/components/private/PrivateDataUnavailable';
import { ConfirmationView } from '@/features/booking/components/ConfirmationView';
import {
  findBookingConfirmationFixture,
  findBookingEventFixture,
} from '@/features/booking/fixtures/booking.fixture';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';
import { isProductionSeo } from '@/lib/seo/site';

import type { Metadata } from 'next';

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = buildPrivateMetadata(
  'Booking Confirmation',
  'View your booking confirmation.',
);

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  await requireGuestSession(`/confirmation/${encodeURIComponent(id)}`);
  if (isProductionSeo()) return <PrivateDataUnavailable title="Confirmation unavailable" />;
  const confirmation = findBookingConfirmationFixture(decodeURIComponent(id));
  if (!confirmation) notFound();

  const event = findBookingEventFixture(confirmation.eventId);
  if (!event) notFound();

  return <ConfirmationView confirmation={confirmation} event={event} />;
}

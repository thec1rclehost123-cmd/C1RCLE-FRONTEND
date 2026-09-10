import { notFound } from 'next/navigation';

import { PrivateDataUnavailable } from '@/components/private/PrivateDataUnavailable';
import { CheckoutView } from '@/features/booking/components/CheckoutView';
import { findBookingEventFixture } from '@/features/booking/fixtures/booking.fixture';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';
import { isProductionSeo } from '@/lib/seo/site';

import type { Metadata } from 'next';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  if (isProductionSeo()) {
    return buildPrivateMetadata('Checkout', 'Complete your event booking securely.');
  }

  const { id } = await params;
  const event = findBookingEventFixture(decodeURIComponent(id));

  return buildPrivateMetadata(
    event ? 'Checkout' : 'Checkout unavailable',
    event ? 'Complete your event booking securely.' : 'This checkout is unavailable.',
  );
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params;
  await requireGuestSession(`/checkout/${encodeURIComponent(id)}`);
  if (isProductionSeo()) return <PrivateDataUnavailable title="Checkout unavailable" />;
  const event = findBookingEventFixture(decodeURIComponent(id));
  if (!event) notFound();

  return <CheckoutView event={event} />;
}

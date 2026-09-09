import { PrivateDataUnavailable } from '@/components/private/PrivateDataUnavailable';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';
import { isProductionSeo } from '@/lib/seo/site';

import { TicketsClient } from './tickets-client';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Tickets',
  'Manage your event passes and digital ticket wallet on THE C1RCLE.',
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TicketsPage() {
  await requireGuestSession('/tickets');
  if (isProductionSeo()) return <PrivateDataUnavailable title="Tickets unavailable" />;
  return <TicketsClient />;
}

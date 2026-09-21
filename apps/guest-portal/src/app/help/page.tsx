import { PrivateDataUnavailable } from '@/components/private/PrivateDataUnavailable';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';
import { isProductionSeo } from '@/lib/seo/site';

import { HelpClient } from './help-client';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Help',
  'Contact the C1RCLE support team about your account, events and tickets.',
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HelpPage() {
  await requireGuestSession('/help');
  if (isProductionSeo()) return <PrivateDataUnavailable title="Help unavailable" />;
  return <HelpClient />;
}
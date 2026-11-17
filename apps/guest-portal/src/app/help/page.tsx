import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

import { HelpClient } from './help-client';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Help',
  'Contact the C1RCLE support team about your account, events and tickets.',
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HelpPage({
  searchParams,
}: {
  readonly searchParams?: Promise<{ request?: string }>;
} = {}) {
  await requireGuestSession('/help');
  const request = (await searchParams)?.request === 'account-deletion' ? 'account-deletion' : null;
  return <HelpClient requestType={request} />;
}

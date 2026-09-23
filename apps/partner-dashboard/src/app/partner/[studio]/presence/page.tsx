import { notFound } from 'next/navigation';

import { PresenceScreen } from '@/components/venue/screens/PresenceScreen';

import type { PresenceTab } from '@/components/venue/screens/PresenceScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Presence' };

const parseTab = (value: string | string[] | undefined): PresenceTab =>
  value === 'menu' || value === 'public' ? value : 'page';

export default async function StudioPresencePage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const query = await searchParams;
  return (
    <PresenceScreen
      studio={studio}
      tab={studio === 'host' ? 'page' : parseTab(query['tab'])}
      requirePermission={false}
      baseHref={`/partner/${studio}/presence`}
    />
  );
}
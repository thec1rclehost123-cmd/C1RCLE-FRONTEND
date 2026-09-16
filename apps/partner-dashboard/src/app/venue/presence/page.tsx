import { PresenceScreen } from '@/components/venue/screens/PresenceScreen';

import type { PresenceTab } from '@/components/venue/screens/PresenceScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Presence · Venue Studio' };

const parseTab = (value: string | string[] | undefined): PresenceTab =>
  value === 'menu' || value === 'public' ? value : 'page';

export default async function VenuePresencePage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <PresenceScreen tab={parseTab(params['tab'])} />;
}

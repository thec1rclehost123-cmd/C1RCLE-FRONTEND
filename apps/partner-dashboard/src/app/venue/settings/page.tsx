import { SettingsScreen } from '@/components/venue/screens/SettingsScreen';

import type { SettingsTab } from '@/components/venue/screens/SettingsScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings · Venue Studio' };

const parseTab = (value: string | string[] | undefined): SettingsTab =>
  value === 'payout' || value === 'team' || value === 'security' ? value : 'profile';

export default async function VenueSettingsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <SettingsScreen tab={parseTab(params['tab'])} />;
}

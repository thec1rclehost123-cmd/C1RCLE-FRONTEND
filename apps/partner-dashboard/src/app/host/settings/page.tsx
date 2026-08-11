import { HostSettingsScreen } from '@/components/host/HostSettingsScreen';

export default async function HostSettingsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tab = (await searchParams)['tab'];
  return <HostSettingsScreen initialTab={typeof tab === 'string' ? tab : 'profile'} />;
}

import { HostPartnersScreen } from '@/components/host/HostPartnersScreen';

export default async function HostPartnersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tab = (await searchParams)['tab'];
  return <HostPartnersScreen initialTab={typeof tab === 'string' ? tab : 'venues'} />;
}

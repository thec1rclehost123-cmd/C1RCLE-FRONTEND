import { HostMarketingScreen } from '@/components/host/HostMarketingScreen';

export default async function HostMarketingPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tab = (await searchParams)['tab'];
  return <HostMarketingScreen initialTab={typeof tab === 'string' ? tab : 'compose'} />;
}

import { PromoterPartnersScreen } from '@/components/promoter/PromoterPartnersScreen';

export default async function PromoterPartnersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tab = typeof params['tab'] === 'string' ? params['tab'] : 'venues';
  const view = typeof params['view'] === 'string' ? params['view'] : 'my';
  return <PromoterPartnersScreen initialTab={tab} initialView={view} />;
}

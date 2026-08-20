import { PromoterPartnersScreen } from '@/components/promoter/PromoterPartnersScreen';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterPartnersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tab = typeof params['tab'] === 'string' ? params['tab'] : 'venues';
  const view = typeof params['view'] === 'string' ? params['view'] : 'my';
  const partners = await partnerRepositories.promoter.getPartners();

  return <PromoterPartnersScreen partners={partners} initialTab={tab} initialView={view} />;
}

import { DashboardPageHeader, EmptyState, PageTabs } from '@/components/partner-shell/DashboardUi';
import { PromoterPartnerCard } from '@/components/promoter/PromoterPartnerCard';
import { partnerRepositories } from '@/lib/partner/repositories';

const views = ['partnered-venues', 'discover-venues', 'partnered-hosts', 'discover-hosts'] as const;
type PartnerView = (typeof views)[number];

export default async function PromoterPartnersPage({ searchParams }: { readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const requested = (await searchParams)['view'];
  const active: PartnerView = typeof requested === 'string' && views.includes(requested as PartnerView) ? requested as PartnerView : 'partnered-venues';
  const [relationship, kind] = active.split('-') as ['partnered' | 'discover', 'venues' | 'hosts'];
  const partners = await partnerRepositories.promoter.getPartners();
  const filtered = partners.filter((partner) => partner.kind === (kind === 'venues' ? 'venue' : 'host') && (relationship === 'partnered' ? partner.status === 'partnered' : partner.status !== 'partnered'));

  return (
    <>
      <DashboardPageHeader eyebrow="Partner network" title="Partners" description="Build repeat relationships with verified venues and hosts. Partnership actions stay separate from public Guest Portal profiles." />
      <PageTabs active={active} items={[
        { label: 'My venues', value: 'partnered-venues', href: '/promoter/partners?view=partnered-venues' },
        { label: 'Discover venues', value: 'discover-venues', href: '/promoter/partners?view=discover-venues' },
        { label: 'My hosts', value: 'partnered-hosts', href: '/promoter/partners?view=partnered-hosts' },
        { label: 'Discover hosts', value: 'discover-hosts', href: '/promoter/partners?view=discover-hosts' },
      ]} />
      {filtered.length ? <section className="promoter-partner-grid">{filtered.map((partner) => <PromoterPartnerCard key={partner.id} partner={partner} />)}</section> : <EmptyState eyebrow="Nothing here yet" title="No matching partners." description="Verified partner recommendations will appear here as the network repository returns matches for your city and categories." />}
    </>
  );
}

import { HostPartnerCard } from '@/components/host/HostPartnerCard';
import { DashboardPageHeader, EmptyState, PageTabs } from '@/components/partner-shell/DashboardUi';
import { partnerRepositories } from '@/lib/partner/repositories';

const views = ['venues', 'promoters'] as const;
type PartnerView = (typeof views)[number];

export default async function HostPartnersPage({ searchParams }: { readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const requested = (await searchParams)['view'];
  const active: PartnerView = typeof requested === 'string' && views.includes(requested as PartnerView) ? requested as PartnerView : 'venues';
  const partners = (await partnerRepositories.host.getPartners()).filter((partner) => partner.kind === (active === 'venues' ? 'venue' : 'promoter'));
  return <><DashboardPageHeader eyebrow="Relationship network" title="Partners" description="Trusted venues and promoters connected to your Host identity." /><PageTabs active={active} items={[{ label: 'Venues', value: 'venues', href: '/host/partners?view=venues' }, { label: 'Promoters', value: 'promoters', href: '/host/partners?view=promoters' }]} />{partners.length ? <section className="host-partner-grid">{partners.map((partner) => <HostPartnerCard key={partner.id} partner={partner} />)}</section> : <EmptyState eyebrow="No partners" title="No matching relationships yet." description="Verified recommendations will appear when the partner repository returns them." />}</>;
}

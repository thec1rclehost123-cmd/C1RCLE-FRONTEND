import { DashboardButton, DashboardPageHeader, EmptyState, PageTabs } from '@/components/partner-shell/DashboardUi';
import { PromoterDiscoveryExplorer } from '@/components/promoter/PromoterDiscoveryExplorer';
import { PromoterEventCard } from '@/components/promoter/PromoterEventCard';
import { partnerRepositories } from '@/lib/partner/repositories';

const views = ['linked', 'discover'] as const;
type EventsView = (typeof views)[number];

export default async function PromoterEventsPage({ searchParams }: { readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const requested = (await searchParams)['view'];
  const active: EventsView = typeof requested === 'string' && views.includes(requested as EventsView) ? requested as EventsView : 'linked';
  const events = active === 'linked' ? await partnerRepositories.promoter.getLinkedEvents() : await partnerRepositories.promoter.discoverEvents();

  return (
    <>
      <DashboardPageHeader eyebrow="Event network" title="Events" description={active === 'linked' ? 'Campaign access, deadlines and performance for events linked to you.' : 'Find events accepting promoter requests and review their terms before applying.'} actions={<DashboardButton href="/promoter/links" tone="primary">Get link</DashboardButton>} />
      <PageTabs active={active} items={[{ label: 'Linked events', value: 'linked', href: '/promoter/events?view=linked' }, { label: 'Discover', value: 'discover', href: '/promoter/events?view=discover' }]} />
      {events.length ? active === 'discover' ? <PromoterDiscoveryExplorer events={events} /> : <section className="promoter-event-grid">{events.map((event) => <PromoterEventCard key={event.id} event={event} />)}</section> : <EmptyState eyebrow="No events yet" title={active === 'linked' ? 'Your linked events will live here.' : 'No open promoter opportunities right now.'} description={active === 'linked' ? 'Discover an opportunity or accept an invite from a venue or host.' : 'We will show new opportunities as verified venues and hosts open promoter access.'} action={<DashboardButton href={active === 'linked' ? '/promoter/events?view=discover' : '/promoter/partners'} tone="primary">{active === 'linked' ? 'Discover events' : 'Explore partners'}</DashboardButton>} />}
    </>
  );
}

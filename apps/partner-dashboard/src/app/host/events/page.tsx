import { HostEventCard } from '@/components/host/HostEventCard';
import { DashboardButton, DashboardPageHeader, EmptyState, PageTabs } from '@/components/partner-shell/DashboardUi';
import { partnerRepositories } from '@/lib/partner/repositories';

const filters = ['all', 'active', 'drafts', 'past'] as const;
type EventFilter = (typeof filters)[number];

const titleCase = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export default async function HostEventsPage({ searchParams }: { readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const requested = (await searchParams)['view'];
  const active: EventFilter = typeof requested === 'string' && filters.includes(requested as EventFilter) ? requested as EventFilter : 'all';
  const allEvents = await partnerRepositories.host.getEvents();
  const events = allEvents.filter((event) => active === 'all' || (active === 'active' && ['on-sale', 'scheduled', 'live', 'sold-out'].includes(event.status)) || (active === 'drafts' && event.status === 'draft') || (active === 'past' && ['completed', 'cancelled'].includes(event.status)));

  return <>
    <DashboardPageHeader eyebrow="Programming" title="Events" description="Every Host-led room, with a clear status and one obvious next action." actions={<DashboardButton href="/host/events/create" tone="primary">Create event</DashboardButton>} />
    <PageTabs active={active} items={filters.map((value) => ({ value, label: value === 'all' ? 'All events' : titleCase(value), href: `/host/events?view=${value}` }))} />
    {events.length ? <section className="host-event-grid">{events.map((event) => <HostEventCard key={event.id} event={event} />)}</section> : <EmptyState eyebrow="No matching events" title="Nothing lives in this view yet." description="Create a new event or change the status filter." action={<DashboardButton href="/host/events/create" tone="primary">Create event</DashboardButton>} />}
  </>;
}

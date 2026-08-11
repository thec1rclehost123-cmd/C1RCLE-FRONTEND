import { notFound } from 'next/navigation';

import { DashboardButton, DashboardPageHeader, DateRangeSelector, MetricCard, MiniBars, PageTabs, SectionHeading } from '@/components/partner-shell/DashboardUi';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

const tabs = ['overview', 'sales', 'audience', 'attribution', 'entry', 'finance'] as const;
type AnalyticsTab = (typeof tabs)[number];
const titleCase = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export default async function HostEventAnalyticsPage({ params, searchParams }: { readonly params: Promise<{ eventId: string }>; readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { eventId } = await params;
  const resolvedSearchParams = await searchParams;
  const requested = resolvedSearchParams['tab'];
  const requestedRange = resolvedSearchParams['range'];
  const active: AnalyticsTab = typeof requested === 'string' && tabs.includes(requested as AnalyticsTab) ? requested as AnalyticsTab : 'overview';
  const range = requestedRange === '7d' || requestedRange === '90d' ? requestedRange : '30d';
  const [event, analytics] = await Promise.all([partnerRepositories.host.getEvent(eventId), partnerRepositories.host.getEventAnalytics(eventId)]);
  if (!event || !analytics) notFound();
  const tabDescription: Record<AnalyticsTab, string> = { overview: 'The complete event health snapshot.', sales: 'Ticket velocity, tiers and value.', audience: 'Privacy-safe audience composition.', attribution: 'Where attention and orders originated.', entry: 'Door throughput and check-in health.', finance: 'Settlement inputs for the Host workspace.' };
  const breakdown = active === 'audience'
    ? event.audienceCities.map((row) => ({ label: row.label, primary: `${String(row.value)}%`, secondary: 'Audience share' }))
    : active === 'attribution'
      ? event.attribution.map((row) => ({ label: row.label, primary: `${String(row.tickets)} tickets`, secondary: `${String(row.clicks)} visits` }))
      : event.ticketTiers.map((row) => ({ label: row.name, primary: `${String(row.sold)} sold`, secondary: `${String(row.inventory)} inventory` }));

  return <>
    <DashboardPageHeader eyebrow={`${event.name} · analytics`} title={titleCase(active)} description={tabDescription[active]} actions={<><DashboardButton href={`/host/events/${event.id}`}>Event detail</DashboardButton><button className="pd-button pd-button--primary" type="button" disabled title="Report export activates with the aggregated analytics API">Download report</button></>} />
    <PageTabs active={active} items={tabs.map((tab) => ({ value: tab, label: titleCase(tab), href: `/host/events/${event.id}/analytics?tab=${tab}` }))} />
    <DateRangeSelector active={range} baseHref={`/host/events/${event.id}/analytics?tab=${active}`} />
    <section className="pd-metrics"><MetricCard label="Tickets sold" value={analytics.ticketsSold.toLocaleString('en-IN')} trend="+14%" tone="positive" /><MetricCard label="Ticket value" value={formatInr(analytics.grossPaise)} detail="before settlement" tone="accent" /><MetricCard label="Conversion" value={`${analytics.conversion.toFixed(1)}%`} detail="visit to order" /><MetricCard label="Check-in rate" value={`${analytics.checkInRate.toFixed(1)}%`} detail={event.status === 'completed' ? 'final' : 'event not completed'} /></section>
    <div className="host-analytics-grid"><section className="pd-surface host-analytics-chart"><SectionHeading title={`${titleCase(active)} trend`} description="Aggregated frontend contract—never raw guest records." /><MiniBars values={analytics.salesTrend} label={`${active} event analytics trend`} /><div className="host-axis"><span>First active day</span><span>Latest</span></div></section><aside className="pd-surface host-analytics-insight"><span>What changed</span><strong>{active === 'entry' ? 'Door data starts on event day.' : 'Momentum is up 14% over the previous comparison window.'}</strong><p>Comparison selectors, exact tooltips and exports activate when the backend aggregated analytics repository is connected.</p></aside></div>
    <section className="host-analytics-table pd-surface"><SectionHeading title={active === 'audience' ? 'Top audience locations' : active === 'attribution' ? 'Top attribution sources' : 'Operational breakdown'} description="A backend-ready table with deliberately privacy-safe fields." /><div>{breakdown.map((row) => <article key={row.label}><strong>{row.label}</strong><span>{row.secondary}</span><b>{row.primary}</b></article>)}</div></section>
  </>;
}

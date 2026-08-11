import Link from 'next/link';

import { HostEventCard } from '@/components/host/HostEventCard';
import { DashboardButton, DashboardPageHeader, MetricCard, MiniBars, SectionHeading, StatusBadge } from '@/components/partner-shell/DashboardUi';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function HostOverviewPage() {
  const [overview, finance] = await Promise.all([partnerRepositories.host.getOverview(), partnerRepositories.host.getFinance()]);
  const sold = overview.nextEvent?.ticketsSold ?? 0;
  return <>
    <DashboardPageHeader eyebrow="Host command center" title={`Good evening, ${overview.profile.name}.`} description="Programming, partner activity and ticket momentum—without operational clutter." actions={<><DashboardButton href="/host/events/create" tone="primary">Create event</DashboardButton><DashboardButton href="/host/partners">Find partners</DashboardButton></>} />
    <section className="pd-metrics"><MetricCard label="Tickets this cycle" value={sold.toLocaleString('en-IN')} trend="+16%" detail="across active events" tone="positive" /><MetricCard label="Active events" value="2" detail="1 more in draft" tone="accent" /><MetricCard label="Partner network" value="18" detail="venues and promoters" /><MetricCard label="Available payout" value={formatInr(finance.availablePaise)} detail={finance.nextPayout} tone="warning" /></section>
    <div className="host-overview-grid"><section><SectionHeading title="Next event" description="The next room carrying your Host identity." action={<Link href="/host/events">All events →</Link>} />{overview.nextEvent ? <HostEventCard event={overview.nextEvent} /> : null}</section><section className="pd-surface host-performance"><SectionHeading title="Ticket momentum" description="Movement over the last 14 active days." /><div className="host-performance-total"><strong>124</strong><span>tickets on latest active day</span></div><MiniBars values={overview.performance} label="Host ticket movement for the last fourteen active days" /><div className="host-axis"><span>14 days ago</span><span>Today</span></div></section></div>
    <div className="host-lower-grid"><section className="pd-surface host-orders"><SectionHeading title="Recent orders" description="Privacy-safe order activity across your events." /><div>{overview.recentOrders.map((order) => <article key={order.id}><div><strong>{order.eventName}</strong><span>{order.createdAt} · {order.channel}</span></div><div><strong>{order.ticketCount} tickets</strong><StatusBadge tone={order.status === 'confirmed' ? 'positive' : order.status === 'refunded' ? 'danger' : 'warning'}>{order.status}</StatusBadge></div></article>)}</div></section><section className="pd-surface host-calendar"><SectionHeading title="Coming up" description="Events, deadlines and settlements." /><div>{overview.calendar.map((item) => <article key={`${item.date}-${item.label}`}><time>{item.date}</time><span className={`is-${item.type}`} /><div><strong>{item.label}</strong><small>{item.type}</small></div></article>)}</div></section></div>
  </>;
}

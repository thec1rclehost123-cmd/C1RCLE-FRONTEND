import Link from 'next/link';

import { DashboardButton, DashboardPageHeader, MetricCard, MiniBars, SectionHeading, StatusBadge } from '@/components/partner-shell/DashboardUi';
import { PromoterEventCard } from '@/components/promoter/PromoterEventCard';
import { PromoterProfileShareButton } from '@/components/promoter/PromoterShareActions';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterOverviewPage() {
  const [overview, finance] = await Promise.all([
    partnerRepositories.promoter.getOverview(),
    partnerRepositories.promoter.getFinance(),
  ]);
  const ticketTotal = overview.recentOrders.reduce((total, order) => order.status === 'confirmed' ? total + order.ticketCount : total, 0);

  return (
    <>
      <DashboardPageHeader
        eyebrow="Today at a glance"
        title={`Good evening, ${overview.profile.name.split(' ')[0] ?? 'promoter'}.`}
        description="Your event opportunities, tracked campaigns and partner activity in one fast workspace."
        actions={<><PromoterProfileShareButton /><DashboardButton href="/promoter/links" tone="primary">Get a tracked link</DashboardButton><DashboardButton href="/promoter/events?view=discover">Discover events</DashboardButton></>}
      />

      <section className="promoter-profile-health pd-surface"><div className="promoter-profile-health-avatar">{overview.profile.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><div><span>{overview.profile.verified ? 'Verified promoter' : 'Identity review pending'}</span><strong>{overview.profile.name} · {overview.profile.handle}</strong><small>Your private Partner Network profile is {overview.profile.completion}% complete. Venues and hosts see ticket movement and collaboration signals—not revenue.</small></div><div className="promoter-profile-health-progress"><span><i /></span><b>{overview.profile.completion}%</b></div><Link href="/promoter/settings">Complete profile →</Link></section>

      <section className="pd-metrics" aria-label="Promoter performance summary">
        <MetricCard label="Tickets moved today" value={String(ticketTotal)} trend="+18%" detail="vs. last active day" tone="positive" />
        <MetricCard label="30-day conversion" value="7.8%" trend="+1.2 pts" detail="tracked visits to orders" tone="accent" />
        <MetricCard label="Active campaigns" value="3" detail="across 2 linked events" />
        <MetricCard label="Available payout" value={formatInr(finance.availablePaise)} detail={finance.nextPayout} tone="warning" />
      </section>

      <div className="promoter-overview-grid">
        <section>
          <SectionHeading title="Next event" description="The next live room connected to your promoter account." action={<Link href="/promoter/events">All events →</Link>} />
          {overview.nextEvent ? <PromoterEventCard event={overview.nextEvent} /> : <section className="pd-empty-state"><span>No linked event</span><h2>You haven’t linked an event yet.</h2><p>Discover events, complete your profile, or connect with a venue or host to begin.</p><div><DashboardButton href="/promoter/events?view=discover" tone="primary">Discover events</DashboardButton></div></section>}
        </section>

        <section className="promoter-performance pd-surface">
          <SectionHeading title="Ticket momentum" description="Tickets attributed to your links over the last 14 active days." />
          <div className="promoter-performance-total"><strong>126</strong><span>tickets on latest active day</span></div>
          <MiniBars values={overview.performance} label="Promoter ticket movement for the last fourteen active days" />
          <div className="promoter-chart-axis"><span>14 days ago</span><span>Today</span></div>
        </section>
      </div>

      <div className="promoter-lower-grid">
        <section className="pd-surface promoter-orders">
          <SectionHeading title="Recent orders" description="Orders attributed to your tracked links." action={<Link href="/promoter/finance">View finance →</Link>} />
          <div className="promoter-order-list">
            {overview.recentOrders.length ? overview.recentOrders.map((order) => (
              <article key={order.id}>
                <div><strong>{order.eventName}</strong><span>{order.createdAt} · {order.channel}</span></div>
                <div><strong>{order.ticketCount} {order.ticketCount === 1 ? 'ticket' : 'tickets'}</strong><StatusBadge tone={order.status === 'confirmed' ? 'positive' : order.status === 'refunded' ? 'danger' : 'warning'}>{order.status}</StatusBadge></div>
              </article>
            )) : <p className="promoter-inline-empty">Orders attributed to your links will appear here without exposing guest personal information.</p>}
          </div>
        </section>

        <section className="pd-surface promoter-calendar">
          <SectionHeading title="Coming up" description="Events, response deadlines and payouts." />
          <div className="promoter-calendar-list">
            {overview.calendar.map((item) => <article key={`${item.date}-${item.label}`}><time>{item.date}</time><span className={`is-${item.type}`} /><div><strong>{item.label}</strong><small>{item.type}</small></div></article>)}
          </div>
        </section>
      </div>
    </>
  );
}

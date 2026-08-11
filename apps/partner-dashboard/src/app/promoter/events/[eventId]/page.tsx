import { notFound } from 'next/navigation';

import { DashboardButton, DashboardPageHeader, MetricCard, MiniBars, SectionHeading, StatusBadge } from '@/components/partner-shell/DashboardUi';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

const visualTone = (id: string): string => {
  if (id.includes('bassline')) return 'violet';
  if (id.includes('sunset')) return 'amber';
  if (id.includes('warehouse')) return 'teal';
  if (id.includes('terrace')) return 'pink';
  if (id.includes('midnight')) return 'slate';
  return 'orange';
};

export default async function PromoterEventDetailPage({ params }: { readonly params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const [linked, discover] = await Promise.all([partnerRepositories.promoter.getLinkedEvents(), partnerRepositories.promoter.discoverEvents()]);
  const event = [...linked, ...discover].find((candidate) => candidate.id === eventId);
  if (!event) notFound();
  const isLinked = linked.some((candidate) => candidate.id === eventId);

  return (
    <>
      <DashboardPageHeader eyebrow={isLinked ? 'Linked event' : 'Promoter opportunity'} title={event.name} description={`${event.date} · ${event.time} · ${event.venue}, ${event.city}`} actions={<><DashboardButton href="/promoter/events">Back to events</DashboardButton>{isLinked ? <DashboardButton href="/promoter/links" tone="primary">Get campaign link</DashboardButton> : null}</>} />
      <section className={`promoter-event-detail-hero promoter-tone promoter-tone--${visualTone(event.id)} pd-surface`}>
        <div><StatusBadge tone={event.status === 'active' ? 'positive' : 'warning'}>{event.status}</StatusBadge><span>{event.category}</span><h2>{event.name}</h2><p>Hosted by {event.host} at {event.venue}</p></div>
        <aside><span>Promoter terms</span><strong>{event.commissionLabel}</strong><small>Final eligibility and attribution rules are supplied by the event contract.</small></aside>
      </section>
      {isLinked ? <>
        <section className="pd-metrics promoter-event-detail-metrics">
          <MetricCard label="Tracked clicks" value={event.clicks.toLocaleString('en-IN')} detail="all active links" />
          <MetricCard label="Tickets moved" value={String(event.tickets)} trend="+14%" detail="current campaign" tone="positive" />
          <MetricCard label="Conversion" value={`${String(event.conversion)}%`} detail="click to purchase" tone="accent" />
          <MetricCard label="Your earnings" value={formatInr(event.earningsPaise)} detail="before settlement" tone="warning" />
        </section>
        <section className="promoter-event-detail-grid">
          <div className="pd-surface promoter-event-chart"><SectionHeading title="Attribution trend" description="Daily tickets attributed to this event's promoter links." /><MiniBars values={[2, 4, 3, 7, 5, 8, 11, 9, 12, 15, 13, 19]} label="Daily attributed ticket trend" /></div>
          <div className="pd-surface promoter-event-checklist"><SectionHeading title="Campaign readiness" description="Everything required before sharing." /><ul><li><span>✓</span><div><strong>Terms accepted</strong><small>{event.commissionLabel}</small></div></li><li><span>✓</span><div><strong>Tracking connected</strong><small>Last checked moments ago</small></div></li><li><span>✓</span><div><strong>Inventory available</strong><small>Synced from event access</small></div></li></ul></div>
        </section>
      </> : <section className="pd-empty-state"><span>Request prepared</span><h2>Review the terms before joining.</h2><p>Partnership requests become actionable when the backend event-access workflow is connected. No request has been sent from this UI preview.</p><div><button type="button" className="pd-button pd-button--primary" disabled>Request access</button></div></section>}
    </>
  );
}

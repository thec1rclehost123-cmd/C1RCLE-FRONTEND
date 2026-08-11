import { DashboardPageHeader, EmptyState, SectionHeading, StatusBadge } from '@/components/partner-shell/DashboardUi';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function HostMarketingPage() {
  const events = await partnerRepositories.host.getEvents();
  return <><DashboardPageHeader eyebrow="Host distribution" title="Marketing" description="Prepare event assets and partner briefs without moving ticket attribution decisions into the browser." /><section className="host-marketing-grid"><div className="pd-surface"><SectionHeading title="Campaign-ready events" description="Events with enough public content to share." /><div className="host-campaign-list">{events.filter((event) => event.status !== 'completed').map((event) => <article key={event.id}><div><StatusBadge tone={event.status === 'on-sale' ? 'positive' : 'neutral'}>{event.status}</StatusBadge><strong>{event.name}</strong><span>{event.date} · {event.venue}</span></div><button type="button" disabled title="Asset generation activates with the campaign API">Prepare assets</button></article>)}</div></div><EmptyState eyebrow="Distribution workflow" title="One event, consistent assets." description="Poster exports, story layouts, promoter briefs and tracked campaign links will live here once their backend workflows are connected." /></section></>;
}

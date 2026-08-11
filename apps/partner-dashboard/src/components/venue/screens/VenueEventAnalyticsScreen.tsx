import {
  DashboardButton,
  DashboardPageHeader,
  DateRangeSelector,
  MetricCard,
  MiniBars,
  PageTabs,
  SectionHeading,
  StatusBadge,
} from '@/components/partner-shell/DashboardUi';

const ANALYTICS_TABS = ['overview', 'sales', 'audience', 'attribution', 'entry', 'finance'] as const;
export type AnalyticsTab = (typeof ANALYTICS_TABS)[number];

const analyticsCopy: Record<AnalyticsTab, { title: string; summary: string; bars: readonly number[]; sideTitle: string }> = {
  overview: { title: 'Event momentum', summary: 'Sales, reach and entry health in one operational view.', bars: [14, 21, 19, 34, 38, 52, 61, 58, 76, 88, 96, 112], sideTitle: 'Today’s priorities' },
  sales: { title: 'Ticket sales', summary: 'Confirmed orders and tickets sold over the selected period.', bars: [8, 12, 18, 22, 17, 31, 39, 45, 57, 62, 74, 86], sideTitle: 'Tier performance' },
  audience: { title: 'Audience growth', summary: 'Privacy-safe audience composition and repeat attendance.', bars: [34, 38, 44, 41, 48, 57, 64, 69, 76, 82, 91, 104], sideTitle: 'Audience signals' },
  attribution: { title: 'Attribution', summary: 'Which discovery surfaces, partners and links are driving purchase.', bars: [12, 17, 14, 24, 31, 28, 42, 47, 55, 63, 71, 80], sideTitle: 'Top sources' },
  entry: { title: 'Entry operations', summary: 'Check-ins, arrival peaks and scan outcomes from Door Mode.', bars: [4, 9, 18, 31, 59, 91, 116, 103, 72, 41, 25, 12], sideTitle: 'Door health' },
  finance: { title: 'Settlement', summary: 'Transparent revenue, deductions and partner allocation.', bars: [21, 33, 38, 48, 52, 68, 74, 89, 93, 108, 118, 131], sideTitle: 'Reconciliation' },
};

export function VenueEventAnalyticsScreen({ activeTab, eventId, range }: { readonly activeTab: AnalyticsTab; readonly eventId: string; readonly range: '7d' | '30d' | '90d' }) {
  const copy = analyticsCopy[activeTab];
  const tabItems = ANALYTICS_TABS.map((tab) => ({ label: tab[0]?.toUpperCase().concat(tab.slice(1)) ?? tab, value: tab, href: `/venue/events/${eventId}/analytics?tab=${tab}` }));
  return (
    <div className="venue-analytics">
      <DashboardPageHeader
        eyebrow="Neon Nights · Live workspace"
        title="Event analytics"
        description="One source of truth for ticket performance, audience, attribution, entry and settlement. Figures shown here are fixture-backed until the analytics contracts are connected."
        actions={<><DashboardButton href={`/venue/events/${eventId}`}>Event details</DashboardButton><DashboardButton href="/venue/door" tone="primary">Open Door Mode</DashboardButton></>}
      />
      <PageTabs items={tabItems} active={activeTab} />
      <div className="pd-metrics">
        <MetricCard label="Tickets sold" value="312 / 400" trend="+18%" detail="versus last week" tone="accent" />
        <MetricCard label="Gross sales" value="₹6.12L" trend="+22%" detail="confirmed orders" tone="positive" />
        <MetricCard label="Conversion" value="8.4%" trend="+1.3 pts" detail="page visit to purchase" />
        <MetricCard label="Checked in" value="184" trend="59%" detail="of sold inventory" tone="warning" />
      </div>

      <section className="venue-analytics-main">
        <article className="pd-surface venue-analytics-chart">
          <SectionHeading title={copy.title} description={copy.summary} action={<div className="venue-analytics-controls"><DateRangeSelector active={range} baseHref={`/venue/events/${eventId}/analytics?tab=${activeTab}`} /><div className="venue-analytics-freshness"><span /> Updated 2m ago</div></div>} />
          <MiniBars values={copy.bars} label={`${copy.title} chart showing a rising performance trend`} />
          <div className="venue-chart-axis"><span>10 Jul</span><span>14 Jul</span><span>18 Jul</span><span>Today</span></div>
        </article>
        <aside className="pd-surface venue-analytics-side">
          <SectionHeading title={copy.sideTitle} />
          <AnalyticsSideContent tab={activeTab} />
        </aside>
      </section>

      <section className="pd-surface venue-analytics-table">
        <SectionHeading title={activeTab === 'finance' ? 'Settlement lines' : 'Performance breakdown'} description="Aggregated rows keep this route fast; raw orders stay behind pagination and exports." action={<button type="button" disabled title="Available when analytics exports are connected">Export CSV</button>} />
        <div className="venue-analytics-table-head"><span>Dimension</span><span>Volume</span><span>Conversion</span><span>Revenue</span><span>Status</span></div>
        {[
          ['Guest Portal discovery', '146 tickets', '9.8%', '₹2,92,000', 'Growing'],
          ['Direct event link', '82 tickets', '8.1%', '₹1,64,000', 'Healthy'],
          ['Promoter links', '56 tickets', '7.4%', '₹1,12,000', 'Tracked'],
          ['Host profile', '28 tickets', '5.9%', '₹56,000', 'Stable'],
        ].map((row, index) => <div className="venue-analytics-table-row" key={row[0]}>{row.slice(0, 4).map((cell) => <span key={cell}>{cell}</span>)}<StatusBadge tone={index === 0 ? 'positive' : index === 2 ? 'accent' : 'neutral'}>{row[4]}</StatusBadge></div>)}
      </section>
    </div>
  );
}

function AnalyticsSideContent({ tab }: { readonly tab: AnalyticsTab }) {
  const content: Record<AnalyticsTab, readonly [string, string, string][]> = {
    overview: [['Capacity alert', '78% sold', 'Prepare a sell-out plan'], ['Promoter momentum', '56 tickets', 'Nightowl is leading'], ['Door readiness', '7 staff', 'Briefing due at 7 PM']],
    sales: [['Gallery Pass', '194 sold', '62% of sales'], ['VIP Access', '86 sold', '28% of sales'], ['Tables', '32 sold', '10% of sales']],
    audience: [['Returning guests', '42%', 'Up 8 points'], ['Mumbai', '78%', 'Largest city'], ['House + Afrobeats', '64%', 'Top affinity']],
    attribution: [['Guest Portal', '146', '47% of tickets'], ['Direct links', '82', '26% of tickets'], ['Promoters', '56', '18% of tickets']],
    entry: [['Successful scans', '184', '99.1% valid'], ['Duplicate scans', '3', 'Resolved'], ['Peak arrival', '10:42 PM', '48 guests / 15m']],
    finance: [['Gross sales', '₹6,12,000', 'Confirmed'], ['Fees + tax', '₹74,200', 'Estimated'], ['Net settlement', '₹5,37,800', 'Final after event']],
  };
  return <div className="venue-analytics-side-list">{content[tab].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>;
}

import Link from 'next/link';

import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { OverviewTrendCard } from '@/components/partner-v3/overview/OverviewTrendCard';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './partner-analytics.module.css';

import type {
  PartnerAnalyticsBreakdown,
  PartnerAnalyticsRange,
  PartnerOrganizationAnalytics,
} from '@/lib/events/load-partner-organization-analytics';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat('en-IN');
const ranges: readonly { value: PartnerAnalyticsRange; label: string }[] = [
  { value: 'all', label: 'Recorded history' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
];

function formatMoney(paise: number): string {
  return money.format(paise / 100);
}

function formatBucket(key: string, breakdown: PartnerAnalyticsBreakdown): string {
  const normalized = key.length === 7 ? `${key}-01` : key.slice(0, 10);
  const date = new Date(`${normalized}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return key;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: PRODUCT_TIME_ZONE,
    ...(breakdown === 'month'
      ? { month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short' }),
  }).format(date);
}

export function ConnectedPartnerAnalyticsScreen({
  analytics,
  studio,
  range = 'all',
  breakdown = 'month',
}: {
  readonly analytics: PartnerOrganizationAnalytics;
  readonly studio: 'host' | 'venue';
  readonly range?: PartnerAnalyticsRange;
  readonly breakdown?: PartnerAnalyticsBreakdown;
}) {
  const selectedTotals = range === 'all' ? null : analytics.lastThirtyDays.totals;
  const totals = {
    gross:
      selectedTotals?.guestGrossCollectedPaise ?? analytics.salesBreakdown.guestGrossCollectedPaise,
    net: selectedTotals?.revenuePaise ?? analytics.overview.totalRevenuePaise,
    tickets: selectedTotals?.totalTicketsIssued ?? analytics.salesBreakdown.totalTicketsIssued,
    orders: selectedTotals?.paidOrderCount ?? analytics.salesBreakdown.paidOrderCount,
  };
  const buckets = analytics.lastThirtyDays.buckets;
  const rows = [...buckets].reverse();
  const insights = analytics.ticketTiers;
  return (
    <PageContainer>
      <main className={styles['page']}>
        <header className={styles['header']}>
          <div>
            <h1>Analytics</h1>
            <span>{studio === 'venue' ? 'Venue' : 'Host'} performance</span>
          </div>
          <form className={styles['filters']} action={`/partner/${studio}/analytics`} method="get">
            <label>
              <span>Time</span>
              <select name="range" defaultValue={range}>
                {ranges.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Breakdown</span>
              <select name="breakdown" defaultValue={breakdown}>
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
              </select>
            </label>
            <button type="submit">Apply</button>
          </form>
        </header>

        <nav className={styles['eventViews']} aria-label="Event views">
          <Link href={`/partner/${studio}/events`}>All Events</Link>
          <Link href={`/partner/${studio}/analytics`} aria-current="page">
            Analytics
          </Link>
        </nav>
        <section className={styles['stats']} aria-label="Analytics summary">
          <Metric label="Gross revenue" value={formatMoney(totals.gross)} />
          <Metric label="Net revenue" value={formatMoney(totals.net)} />
          <Metric label="Tickets issued" value={count.format(totals.tickets)} />
          <Metric label="Paid orders" value={count.format(totals.orders)} />
        </section>

        {range === 'all' ? (
          <p className={styles['scopeNote']}>
            Recorded totals use the existing bounded analytics read model. The chart shows its
            stated dates.
          </p>
        ) : null}
        <OverviewTrendCard
          title="Sales over time"
          series={(['tickets', 'revenue'] as const).map((metric) => ({
            metric,
            range: 'All' as const,
            value:
              metric === 'tickets'
                ? count.format(buckets.reduce((sum, b) => sum + b.totalTicketsIssued, 0))
                : formatMoney(buckets.reduce((sum, b) => sum + b.guestGrossCollectedPaise, 0)),
            delta: '',
            points: buckets.map((bucket) =>
              metric === 'tickets'
                ? bucket.totalTicketsIssued
                : bucket.guestGrossCollectedPaise / 100,
            ),
            caption: `${analytics.lastThirtyDays.from} – ${analytics.lastThirtyDays.to}`,
            pointLabels: buckets.map((bucket) =>
              formatBucket(
                bucket.key,
                analytics.lastThirtyDays.granularity === 'month' ? 'month' : 'day',
              ),
            ),
          }))}
          rangeOptions={[]}
          initialRange="All"
        />
        <section className={styles['splitGrid']} aria-label="Revenue and ticket breakdown">
          <div className={styles['panel']}>
            <h2>Revenue breakdown</h2>
            <DataRow label="Guest payments" value={formatMoney(totals.gross)} />
            <DataRow
              label="Ticket revenue"
              value={formatMoney(
                selectedTotals?.ticketRevenuePaise ?? analytics.salesBreakdown.ticketRevenuePaise,
              )}
            />
            <DataRow label="Net captured after refunds" value={formatMoney(totals.net)} />
          </div>
          <div className={styles['panel']}>
            <h2>Ticket activity</h2>
            <DataRow
              label="Paid tickets"
              value={count.format(
                selectedTotals?.paidTickets ?? analytics.salesBreakdown.paidTickets,
              )}
            />
            <DataRow
              label="Free RSVP tickets"
              value={count.format(
                selectedTotals?.freeRsvpTickets ?? analytics.salesBreakdown.freeRsvpTickets,
              )}
            />
            <DataRow
              label="Check-ins"
              value={count.format(selectedTotals?.checkIns ?? analytics.overview.totalCheckIns)}
            />
          </div>
        </section>

        <section className={styles['panel']} aria-label="Tickets by tier">
          <div className={styles['panelHeading']}>
            <h2>Tickets by tier</h2>
            <span>
              {analytics.lastThirtyDays.from} – {analytics.lastThirtyDays.to}
            </span>
          </div>
          <p className={styles['empty']}>Issued ticket units · before refunds.</p>
          {insights === null || insights === undefined ? (
            <p>Tier performance unavailable.</p>
          ) : insights.rows.length === 0 ? (
            <p>No ticket issuance in this period.</p>
          ) : (
            insights.rows.map((row) => (
              <div className={styles['tierRow']} key={`${row.eventId}:${row.tierId}`}>
                <div>
                  <span>
                    {row.name} · {row.eventName}
                  </span>
                  <strong>{count.format(row.tickets)}</strong>
                </div>
                <progress
                  aria-label={`${row.name} issued units`}
                  value={row.tickets}
                  max={Math.max(...insights.rows.map((r) => r.tickets), 1)}
                />
              </div>
            ))
          )}
        </section>
        {insights ? (
          <section className={styles['splitGrid']} aria-label="Sales insights">
            <div className={styles['panel']}>
              <h2>Sales attribution</h2>
              <DataRow
                label="Promoter-attributed units"
                value={count.format(insights.channels.promoter)}
              />
              <DataRow
                label="Unattributed units"
                value={count.format(insights.channels.unattributed)}
              />
              <p className={styles['empty']}>
                Captured order attribution, before refunds. Unattributed does not imply a marketing
                channel.
              </p>
            </div>
            <div className={styles['panel']}>
              <h2>Purchase timing</h2>
              <p className={styles['empty']}>Confirmed orders · weekday UTC · includes Free RSVP</p>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div className={styles['timingRow']} key={day}>
                  <span>{day}</span>
                  <progress
                    aria-label={`${day} captured orders`}
                    value={insights.purchaseDays[index]}
                    max={Math.max(...insights.purchaseDays, 1)}
                  />
                  <strong>{insights.purchaseDays[index]}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {range === 'all' ? (
          <section className={styles['panel']}>
            <div className={styles['panelHeading']}>
              <h2>Top events</h2>
              <span>Recorded history</span>
            </div>
            {analytics.overview.topEvents.length ? (
              <div className={styles['tableWrap']}>
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Tickets</th>
                      <th>Net revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.overview.topEvents.map((event) => (
                      <tr key={event.eventId}>
                        <td>{event.title}</td>
                        <td>{formatBucket(event.date.slice(0, 10), 'day')}</td>
                        <td>{count.format(event.tickets)}</td>
                        <td>{formatMoney(event.revenuePaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles['empty']}>No event sales yet.</p>
            )}
          </section>
        ) : null}

        <section className={styles['panel']}>
          <div className={styles['panelHeading']}>
            <h2>
              {range === 'all'
                ? 'Recent activity'
                : `Activity by ${analytics.lastThirtyDays.granularity === 'month' ? 'month' : 'day'}`}
            </h2>
            <span>{rows.length} periods</span>
          </div>
          <div className={styles['tableWrap']}>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Gross revenue</th>
                  <th>Net revenue</th>
                  <th>Tickets</th>
                  <th>Paid orders</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((bucket) => (
                  <tr key={bucket.key}>
                    <td>
                      {formatBucket(
                        bucket.key,
                        analytics.lastThirtyDays.granularity === 'month' ? 'month' : 'day',
                      )}
                    </td>
                    <td>{formatMoney(bucket.guestGrossCollectedPaise)}</td>
                    <td>{formatMoney(bucket.revenuePaise)}</td>
                    <td>{count.format(bucket.totalTicketsIssued)}</td>
                    <td>{count.format(bucket.paidOrderCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </PageContainer>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={styles['stat']}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={styles['dataRow']}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

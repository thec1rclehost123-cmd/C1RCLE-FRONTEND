import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './partner-analytics.module.css';

import type {
  PartnerAnalyticsBreakdown,
  PartnerAnalyticsRange,
  PartnerOrganizationAnalytics,
} from '@/lib/events/load-partner-organization-analytics';
import type { TrendBucketDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat('en-IN');
const ranges: readonly { value: PartnerAnalyticsRange; label: string }[] = [
  { value: 'all', label: 'All time' },
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

function LineChart({
  buckets,
  value,
  color,
  format,
  label,
}: {
  readonly buckets: readonly TrendBucketDto[];
  readonly value: (bucket: TrendBucketDto) => number;
  readonly color: string;
  readonly format: (value: number) => string;
  readonly label: string;
}) {
  const values = buckets.map(value);
  const max = Math.max(...values, 1);
  const points = values
    .map((point, index) => {
      const x = values.length < 2 ? 320 : 16 + (index / (values.length - 1)) * 608;
      const y = 174 - (point / max) * 148;
      return `${String(x)},${String(y)}`;
    })
    .join(' ');
  const first = buckets[0]?.key;
  const last = buckets.at(-1)?.key;

  return (
    <section className={styles['chartCard']} aria-label={label}>
      <div className={styles['chartHeading']}>
        <h2>{label}</h2>
        <strong>{format(values.reduce((sum, current) => sum + current, 0))}</strong>
      </div>
      <svg
        className={styles['lineChart']}
        viewBox="0 0 640 200"
        role="img"
        aria-label={`${label} trend`}
      >
        {[26, 75, 124, 174].map((y) => (
          <line key={y} x1="8" x2="632" y1={y} y2={y} className={styles['gridLine']} />
        ))}
        {values.length > 0 ? (
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
      </svg>
      <div className={styles['chartAxis']}>
        <span>
          {first
            ? formatBucket(first, buckets[0]?.key.length === 7 ? 'month' : 'day')
            : 'No activity'}
        </span>
        <span>
          {last ? formatBucket(last, buckets.at(-1)?.key.length === 7 ? 'month' : 'day') : ''}
        </span>
      </div>
    </section>
  );
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

        <section className={styles['stats']} aria-label="Analytics summary">
          <Metric label="Gross revenue" value={formatMoney(totals.gross)} />
          <Metric label="Net revenue" value={formatMoney(totals.net)} />
          <Metric label="Tickets issued" value={count.format(totals.tickets)} />
          <Metric label="Paid orders" value={count.format(totals.orders)} />
        </section>

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

        <section className={styles['chartGrid']} aria-label="Performance trends">
          <LineChart
            buckets={buckets}
            value={(bucket) => bucket.guestGrossCollectedPaise}
            color="#ff6842"
            format={formatMoney}
            label={range === 'all' ? 'Recent gross revenue' : 'Gross revenue'}
          />
          <LineChart
            buckets={buckets}
            value={(bucket) => bucket.tickets}
            color="#a78bfa"
            format={(value) => count.format(value)}
            label={range === 'all' ? 'Recent tickets issued' : 'Tickets issued'}
          />
        </section>

        {range === 'all' ? (
          <section className={styles['panel']}>
            <div className={styles['panelHeading']}>
              <h2>Top events</h2>
              <span>Lifetime</span>
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

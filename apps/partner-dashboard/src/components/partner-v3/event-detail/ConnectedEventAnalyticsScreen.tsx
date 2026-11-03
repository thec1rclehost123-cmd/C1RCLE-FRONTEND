import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './event-analytics.module.css';

import type { EventAnalyticsDto } from '@c1rcle/contracts';
import type { ReactNode } from 'react';

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(paise: number): string {
  return rupees.format(paise / 100);
}

function percentage(ratio: number | null): string {
  return ratio === null ? '—' : `${String(Math.round(ratio * 100))}%`;
}

function Donut({
  value,
  total,
  center,
  label,
}: {
  readonly value: number;
  readonly total: number;
  readonly center: string;
  readonly label: string;
}) {
  const fraction = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className={styles['donutWrap']} role="img" aria-label={label}>
      <svg className={styles['donut']} viewBox="0 0 100 100" aria-hidden="true">
        <circle className={styles['donutTrack']} cx="50" cy="50" r="42" />
        <circle
          className={styles['donutValue']}
          cx="50"
          cy="50"
          r="42"
          strokeDasharray={`${String(fraction * circumference)} ${String(circumference)}`}
        />
      </svg>
      <span className={styles['donutCenter']}>{center}</span>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly className?: string | undefined;
}) {
  return (
    <section
      className={className ? `${styles['card'] ?? ''} ${className}` : (styles['card'] ?? '')}
      aria-label={title}
    >
      <h2 className={styles['cardTitle']}>{title}</h2>
      {children}
    </section>
  );
}

function Unavailable({ children = 'No data' }: { readonly children?: string }) {
  return <p className={styles['unavailable']}>{children}</p>;
}

/** Event totals are API-backed. Unavailable breakdowns stay explicit rather than fabricated. */
export function ConnectedEventAnalyticsScreen({
  analytics,
  studio: _studio,
}: {
  readonly analytics: EventAnalyticsDto;
  readonly studio: 'host' | 'venue';
}) {
  const unscanned = Math.max(0, analytics.ticketsSold - analytics.totalCheckIns);
  const remainingInventory = Math.max(0, analytics.totalTicketInventory - analytics.ticketsSold);
  const inventoryKnown = analytics.totalTicketInventory >= analytics.ticketsSold;
  const stats = [
    { label: 'Page visits', value: analytics.views.toLocaleString('en-IN') },
    { label: 'Conversion rate', value: percentage(analytics.conversionRate) },
    { label: 'Tickets sold', value: analytics.ticketsSold.toLocaleString('en-IN') },
    { label: 'Gross amount paid', value: money(analytics.totalRevenuePaise) },
  ];

  return (
    <PageContainer>
      <main className={styles['main']}>
        <div className={styles['headingRow']}>
          <div>
            <h1 className={styles['title']}>Event analytics</h1>
          </div>
          <span className={styles['range']}>All time</span>
        </div>

        <div className={styles['stats']}>
          {stats.map((stat) => (
            <section className={styles['stat']} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </section>
          ))}
        </div>

        <div className={styles['gridTwo']}>
          <ChartCard title="Conversion funnel">
            <div className={styles['funnel']}>
              <div>
                <span>Event page visits</span>
                <strong>{analytics.views.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span>Guestlist sign-ups</span>
                <strong>{analytics.guestlistSignups.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span>Tickets sold</span>
                <strong>{analytics.ticketsSold.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </ChartCard>
          <ChartCard title="Check-ins">
            <div className={styles['donutCard']}>
              <Donut
                value={analytics.totalCheckIns}
                total={analytics.ticketsSold}
                center={percentage(
                  analytics.ticketsSold ? analytics.totalCheckIns / analytics.ticketsSold : 0,
                )}
                label={`${String(analytics.totalCheckIns)} checked in of ${String(analytics.ticketsSold)} tickets sold`}
              />
              <div className={styles['legend']}>
                <span>
                  <i className={styles['orangeDot']} /> Checked in{' '}
                  <b>{analytics.totalCheckIns.toLocaleString('en-IN')}</b>
                </span>
                <span>
                  <i className={styles['mutedDot']} /> Not checked in{' '}
                  <b>{unscanned.toLocaleString('en-IN')}</b>
                </span>
              </div>
            </div>
          </ChartCard>
        </div>

        <div className={styles['gridThree']}>
          <ChartCard title="Ticket inventory">
            {inventoryKnown ? (
              <div className={styles['donutCard']}>
                <Donut
                  value={analytics.ticketsSold}
                  total={analytics.totalTicketInventory}
                  center={percentage(
                    analytics.totalTicketInventory
                      ? analytics.ticketsSold / analytics.totalTicketInventory
                      : 0,
                  )}
                  label={`${String(analytics.ticketsSold)} sold of ${String(analytics.totalTicketInventory)} tickets in inventory`}
                />
                <div className={styles['legend']}>
                  <span>
                    <i className={styles['orangeDot']} /> Sold{' '}
                    <b>{analytics.ticketsSold.toLocaleString('en-IN')}</b>
                  </span>
                  <span>
                    <i className={styles['mutedDot']} /> Remaining{' '}
                    <b>{remainingInventory.toLocaleString('en-IN')}</b>
                  </span>
                </div>
              </div>
            ) : (
              <Unavailable>
                Inventory is lower than recorded ticket sales; this chart is withheld.
              </Unavailable>
            )}
          </ChartCard>
          <ChartCard title="Ticket sales source">
            <Unavailable />
          </ChartCard>
          <ChartCard title="New vs returning guests">
            <p className={styles['singleMetric']}>
              {analytics.repeatGuests.toLocaleString('en-IN')}
            </p>
            <p className={styles['metricCaption']}>Distinct guests with tickets</p>
            <Unavailable>Guest history unavailable</Unavailable>
          </ChartCard>
        </div>

        <div className={styles['gridTwo']}>
          <ChartCard title="Gross ticket sales over time">
            <Unavailable>Time series unavailable</Unavailable>
          </ChartCard>
          <ChartCard title="Orders over time">
            <Unavailable>Time series unavailable</Unavailable>
          </ChartCard>
        </div>

        <div className={styles['gridTwo']}>
          <ChartCard title="Gender ratio">
            <Unavailable />
          </ChartCard>
          <ChartCard title="Attendee location">
            <Unavailable />
          </ChartCard>
        </div>

        <ChartCard title="Tickets sold by type">
          <Unavailable>Ticket type data unavailable</Unavailable>
        </ChartCard>
        <ChartCard title="Tickets scanned by type">
          <Unavailable>Ticket type data unavailable</Unavailable>
        </ChartCard>

        <ChartCard title="Additional event metrics" className={styles['metricsCard']}>
          <dl className={styles['metricGrid']}>
            {[
              ['Ticket inventory', analytics.totalTicketInventory.toLocaleString('en-IN')],
              ['Room capacity', analytics.capacity?.toLocaleString('en-IN') ?? 'Not configured'],
              ['Average amount paid per ticket', money(analytics.avgTicketPricePaise)],
              ['Occupancy', percentage(analytics.occupancyRate)],
              ['Sell-through', percentage(analytics.sellThroughRate)],
              ['Refunded', money(analytics.refundAmountPaise)],
              ['Refund rate', percentage(analytics.refundRate)],
              ['No-show rate', percentage(analytics.noShowRate)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </ChartCard>
      </main>
    </PageContainer>
  );
}

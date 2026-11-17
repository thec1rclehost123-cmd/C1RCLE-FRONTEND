import Link from 'next/link';

import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './venue-operational-analytics.module.css';

import type { PartnerAnalyticsRange } from '@/lib/events/load-partner-organization-analytics';
import type { VenueOperationalAnalyticsDto } from '@c1rcle/contracts';

const count = new Intl.NumberFormat('en-IN');
const ranges: readonly { readonly value: PartnerAnalyticsRange; readonly label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'Recorded 12 months' },
];

function formatDay(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: PRODUCT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: PRODUCT_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function VenueOperationalAnalyticsScreen({
  analytics,
  range,
}: {
  readonly analytics: VenueOperationalAnalyticsDto;
  readonly range: PartnerAnalyticsRange;
}) {
  const metrics = [
    ['Events', analytics.summary.eventCount],
    ['Ticket units', analytics.summary.ticketUnitsIssued],
    ['RSVP units', analytics.summary.rsvpUnitsIssued],
    ['Expected guests', analytics.summary.expectedGuests],
    ['Checked in', analytics.summary.checkedInGuests],
    ['Physical Venue capacity', analytics.summary.physicalVenueCapacity],
  ] as const;
  return (
    <PageContainer>
      <main className={styles['page']}>
        <header className={styles['header']}>
          <div>
            <p>Venue operations · {analytics.timeZone}</p>
            <h1>Analytics</h1>
          </div>
          <form action="/partner/venue/analytics" method="get">
            <label>
              <span>Time range</span>
              <select name="range" defaultValue={range}>
                {ranges.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Apply</button>
          </form>
        </header>
        <nav className={styles['nav']} aria-label="Venue analytics links">
          <Link href="/partner/venue/events">All events</Link>
          <Link href="/partner/venue/analytics" aria-current="page">
            Analytics
          </Link>
        </nav>
        <section className={styles['metrics']} aria-label="Venue operational summary">
          {metrics.map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{count.format(value)}</strong>
            </article>
          ))}
          <article>
            <span>Expected capacity use</span>
            <strong>
              {analytics.summary.expectedOccupancyPercent === null
                ? 'Not available'
                : `${count.format(analytics.summary.expectedOccupancyPercent)}%`}
            </strong>
          </article>
        </section>
        {!analytics.summary.complete ? (
          <p className={styles['incomplete']} role="status">
            Some operational counts are incomplete; displayed counts are lower bounds.
          </p>
        ) : null}

        <section className={styles['section']} aria-labelledby="venue-daily-operations">
          <h2 id="venue-daily-operations">Daily operations</h2>
          <div className={styles['tableScroll']}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Events</th>
                  <th>Ticket units</th>
                  <th>RSVP units</th>
                  <th>Expected guests</th>
                  <th>Checked in</th>
                  <th>Physical Venue cap</th>
                  <th>Expected use</th>
                </tr>
              </thead>
              <tbody>
                {analytics.days.map((day) => (
                  <tr key={day.date}>
                    <th scope="row">{formatDay(day.date)}</th>
                    <td>{count.format(day.eventCount)}</td>
                    <td>{count.format(day.ticketUnitsIssued)}</td>
                    <td>{count.format(day.rsvpUnitsIssued)}</td>
                    <td>{count.format(day.expectedGuests)}</td>
                    <td>{count.format(day.checkedInGuests)}</td>
                    <td>{count.format(day.physicalVenueCapacity)}</td>
                    <td>
                      {day.expectedOccupancyPercent === null
                        ? '—'
                        : `${count.format(day.expectedOccupancyPercent)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles['section']} aria-labelledby="venue-event-operations">
          <h2 id="venue-event-operations">Event operations</h2>
          {analytics.events.length ? (
            <div className={styles['eventList']}>
              {analytics.events.map((event) => (
                <Link href={`/partner/venue/events/${encodeURIComponent(event.id)}`} key={event.id}>
                  <strong>{event.title}</strong>
                  <span>
                    {event.hostName ? `Hosted by ${event.hostName} · ` : ''}
                    {formatEventDate(event.startAt)} · {event.status.replaceAll('_', ' ')}
                  </span>
                  <small>
                    {count.format(event.ticketUnitsIssued)} ticket units ·{' '}
                    {count.format(event.rsvpUnitsIssued)} RSVP units ·{' '}
                    {count.format(event.expectedGuests)} expected ·{' '}
                    {count.format(event.checkedInGuests)} checked in · Venue capacity{' '}
                    {event.venueCapacity === null ? 'not set' : count.format(event.venueCapacity)} ·
                    Event cap{' '}
                    {event.eventCapacity === null ? 'not set' : count.format(event.eventCapacity)}
                  </small>
                </Link>
              ))}
            </div>
          ) : (
            <p>No operational events in this range.</p>
          )}
        </section>
      </main>
    </PageContainer>
  );
}

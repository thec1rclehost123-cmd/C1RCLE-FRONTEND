import Link from 'next/link';

import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './venue-operational-overview.module.css';

import type { VenueOperationalOverviewDto } from '@c1rcle/contracts';

const numberFormat = new Intl.NumberFormat('en-IN');
const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  timeZone: PRODUCT_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const summaryItems = [
  ['Events tonight', 'eventsTonight'],
  ['Upcoming events', 'upcomingEvents'],
  ['Ticket units', 'ticketUnitsIssued'],
  ['RSVP units', 'rsvpUnitsIssued'],
  ['Expected guests', 'expectedGuests'],
  ['Checked in', 'checkedInGuests'],
  ['Physical Venue capacity', 'physicalVenueCapacity'],
] as const;

export function VenueOperationalOverviewScreen({
  data,
}: {
  readonly data: VenueOperationalOverviewDto;
}) {
  const occupancy = data.summary.expectedOccupancyPercent;
  return (
    <PageContainer>
      <main className={styles['page']}>
        <header className={styles['header']}>
          <div>
            <p>Venue operations</p>
            <h1>Overview</h1>
            <span>Events at your Venue, including accepted Host bookings</span>
          </div>
          <nav aria-label="Venue overview links">
            <Link href="/partner/venue/events">All events</Link>
            <Link href="/partner/venue/calendar">Calendar</Link>
            <Link href="/partner/venue/analytics">Analytics</Link>
          </nav>
        </header>

        <section className={styles['metrics']} aria-label="Upcoming Venue operations">
          {summaryItems.map(([label, key]) => (
            <article className={styles['metric']} key={key}>
              <span>{label}</span>
              <strong>{numberFormat.format(data.summary[key])}</strong>
            </article>
          ))}
          <article className={styles['metric']}>
            <span>Expected capacity use</span>
            <strong>
              {occupancy === null ? 'Not available' : `${numberFormat.format(occupancy)}%`}
            </strong>
          </article>
        </section>
        {!data.summary.complete ? (
          <p className={styles['incomplete']} role="status">
            Some operational counts are incomplete; displayed counts are lower bounds.
          </p>
        ) : null}

        <section className={styles['events']} aria-labelledby="venue-upcoming-events">
          <div className={styles['sectionHeading']}>
            <div>
              <p>Venue schedule</p>
              <h2 id="venue-upcoming-events">Upcoming events</h2>
            </div>
            <Link href="/partner/venue/events">View all</Link>
          </div>
          {data.upcomingEvents.length ? (
            <ul>
              {data.upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link href={`/partner/venue/events/${encodeURIComponent(event.id)}`}>
                    <strong>{event.title}</strong>
                    <span>
                      Hosted by {event.hostName ?? 'Host name unavailable'} ·{' '}
                      {dateTimeFormat.format(new Date(event.startAt))} IST ·{' '}
                      {event.status.replaceAll('_', ' ')}
                    </span>
                    <small>
                      {numberFormat.format(event.expectedGuests)} expected guests ·{' '}
                      {numberFormat.format(event.checkedInGuests)} checked in · Venue capacity{' '}
                      {event.venueCapacity === null
                        ? 'not set'
                        : numberFormat.format(event.venueCapacity)}{' '}
                      · Event cap{' '}
                      {event.eventCapacity === null
                        ? 'not set'
                        : numberFormat.format(event.eventCapacity)}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles['empty']}>No upcoming operational events at this Venue.</p>
          )}
        </section>
      </main>
    </PageContainer>
  );
}

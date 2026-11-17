import styles from './VenueLiveEventSummaryScreen.module.css';

import type { VenueEventDetailViewModel } from '@/lib/events/load-venue-event-detail';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

const count = (value: number) => value.toLocaleString('en-IN');

export function VenueLiveEventSummaryScreen({
  record,
}: {
  readonly record: VenueEventDetailViewModel;
}) {
  const { event, tiers } = record;
  const dateRange = `${dateTime.format(new Date(event.startAt))}${event.endAt ? ` – ${dateTime.format(new Date(event.endAt))}` : ''} IST`;
  return (
    <main className={styles['page']}>
      <section className={styles['panel']} aria-labelledby="venue-event-overview">
        <div className={styles['sectionHeading']}>
          <div>
            <p className={styles['eyebrow']}>Venue operational view · View only</p>
            <h2 id="venue-event-overview">Overview</h2>
          </div>
          <span className={styles['status']}>{event.status.replaceAll('_', ' ')}</span>
        </div>
        <dl className={styles['details']}>
          <div>
            <dt>Hosted by</dt>
            <dd>
              {event.ownerType === 'host' ? (event.hostName ?? 'Host name unavailable') : 'Venue'}
            </dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{event.venueName}</dd>
          </div>
          <div>
            <dt>Schedule</dt>
            <dd>{dateRange}</dd>
          </div>
          <div>
            <dt>Expected guests</dt>
            <dd>
              {event.operationalCountsComplete ? '' : 'At least '}
              {count(event.expectedGuests)}
            </dd>
          </div>
          <div>
            <dt>Checked in</dt>
            <dd>{count(event.checkedInGuests)}</dd>
          </div>
          <div>
            <dt>Admission units</dt>
            <dd>
              {count(event.ticketUnitsIssued)} ticket · {count(event.rsvpUnitsIssued)} RSVP
            </dd>
          </div>
          <div>
            <dt>Physical Venue capacity</dt>
            <dd>{event.venueCapacity === null ? 'Not configured' : count(event.venueCapacity)}</dd>
          </div>
          <div>
            <dt>Event capacity</dt>
            <dd>{event.eventCapacity === null ? 'Not configured' : count(event.eventCapacity)}</dd>
          </div>
        </dl>
        {!event.operationalCountsComplete ? (
          <p className={styles['salesWindow']} role="status">
            Operational counts are incomplete; attendance figures are lower bounds.
          </p>
        ) : null}
      </section>

      <section className={styles['panel']} aria-labelledby="venue-event-tiers">
        <div className={styles['sectionHeading']}>
          <div>
            <p className={styles['eyebrow']}>Admission</p>
            <h2 id="venue-event-tiers">Ticket and RSVP categories</h2>
          </div>
          <span className={styles['tierCount']}>{tiers.length} categories</span>
        </div>
        {tiers.length ? (
          <div className={styles['tierList']}>
            {tiers.map((tier) => (
              <article className={styles['tier']} key={tier.tierId}>
                <div className={styles['tierTop']}>
                  <h3>{tier.name}</h3>
                  <strong>{tier.unitKind === 'rsvp' ? 'RSVP' : 'Ticket'}</strong>
                </div>
                <dl className={styles['tierFacts']}>
                  <div>
                    <dt>Units issued</dt>
                    <dd>{count(tier.unitsIssued)}</dd>
                  </div>
                  <div>
                    <dt>Expected guests</dt>
                    <dd>{count(tier.expectedGuests)}</dd>
                  </div>
                  <div>
                    <dt>Checked in</dt>
                    <dd>{count(tier.checkedInGuests)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles['empty']}>No operational ticket categories are available.</p>
        )}
      </section>
    </main>
  );
}

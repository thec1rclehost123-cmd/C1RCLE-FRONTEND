import styles from '../event-detail/VenueEventDetail.module.css';

import type { VenueEventDetailResponse } from '@c1rcle/contracts';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

export function VenueLiveEventSummaryScreen({
  record,
}: {
  readonly record: VenueEventDetailResponse;
}) {
  const { event, tiers } = record;
  return (
    <div className={styles['summaryGrid']}>
      <section className={styles['panel']} aria-labelledby="live-event-overview">
        <h2 id="live-event-overview">Event overview</h2>
        <p>{event.summary || event.description || 'No event description provided.'}</p>
        <dl>
          <dt>Lifecycle</dt>
          <dd>{event.status.replaceAll('_', ' ')}</dd>
          <dt>Owner</dt>
          <dd>Host organization · {event.organizationId}</dd>
          <dt>Venue</dt>
          <dd>{event.venueId ?? event.externalLocation?.name ?? 'Venue not specified'}</dd>
          <dt>Start</dt>
          <dd>{dateTime.format(new Date(event.startAt))} IST</dd>
          <dt>End</dt>
          <dd>{event.endAt ? `${dateTime.format(new Date(event.endAt))} IST` : 'Not specified'}</dd>
        </dl>
      </section>

      <section className={styles['panel']} aria-labelledby="live-event-tiers">
        <h2 id="live-event-tiers">Ticket tiers and pricing</h2>
        {tiers.length === 0 ? <p>No ticket tiers are configured.</p> : null}
        {tiers.map((tier) => (
          <article key={tier.id}>
            <h3>{tier.name}</h3>
            <p>
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: tier.currency,
                maximumFractionDigits: 2,
              }).format(tier.priceInPaise / 100)}{' '}
              base · {tier.quantity} capacity
              {tier.maxPerOrder === null ? '' : ` · max ${String(tier.maxPerOrder)} per order`}
            </p>
            {tier.pricingPhases?.map((phase) => (
              <p key={phase.id}>
                {phase.name}: ₹{(phase.priceInPaise / 100).toLocaleString('en-IN')} ·{' '}
                {dateTime.format(new Date(phase.startsAt))} to{' '}
                {dateTime.format(new Date(phase.endsAt))}
                {phase.quantity === null ? '' : ` · ${String(phase.quantity)} phase tickets`}
              </p>
            ))}
            {tier.salesStartAt || tier.salesEndAt ? (
              <p>
                Sales window:{' '}
                {tier.salesStartAt ? dateTime.format(new Date(tier.salesStartAt)) : 'open'}
                {' – '}
                {tier.salesEndAt ? dateTime.format(new Date(tier.salesEndAt)) : 'no end'}
              </p>
            ) : null}
          </article>
        ))}
      </section>

      {event.media ? (
        <section className={styles['panel']} aria-labelledby="live-event-media">
          <h2 id="live-event-media">Event media</h2>
          {event.media.youtubeUrl ? <p>Video: {event.media.youtubeUrl}</p> : null}
          {event.media.gallery.map((image) => (
            <figure key={image.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt} />
              <figcaption>{image.alt}</figcaption>
            </figure>
          ))}
        </section>
      ) : null}
    </div>
  );
}

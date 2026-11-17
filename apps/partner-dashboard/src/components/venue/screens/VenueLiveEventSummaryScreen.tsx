import styles from './VenueLiveEventSummaryScreen.module.css';

import type { VenueEventDetailResponse } from '@c1rcle/contracts';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

const currency = (amountInPaise: number, code: string) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2,
  }).format(amountInPaise / 100);

export function VenueLiveEventSummaryScreen({
  record,
}: {
  readonly record: VenueEventDetailResponse;
}) {
  const { event, tiers } = record;
  return (
    <main className={styles['page']}>
      <section className={styles['panel']} aria-labelledby="venue-event-overview">
        <div className={styles['sectionHeading']}>
          <div>
            <p className={styles['eyebrow']}>Event workspace</p>
            <h2 id="venue-event-overview">Overview</h2>
          </div>
          <span className={styles['status']}>{event.status.replaceAll('_', ' ')}</span>
        </div>
        <p className={styles['description']}>
          {event.summary || event.description || 'No event description provided.'}
        </p>
        <dl className={styles['details']}>
          <div>
            <dt>Event owner</dt>
            <dd>Host organization · {event.organizationId}</dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{event.venueId ?? event.externalLocation?.name ?? 'Venue not specified'}</dd>
          </div>
          <div>
            <dt>Starts</dt>
            <dd>{dateTime.format(new Date(event.startAt))} IST</dd>
          </div>
          <div>
            <dt>Ends</dt>
            <dd>
              {event.endAt ? `${dateTime.format(new Date(event.endAt))} IST` : 'Not specified'}
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles['panel']} aria-labelledby="venue-event-tiers">
        <div className={styles['sectionHeading']}>
          <div>
            <p className={styles['eyebrow']}>Admission</p>
            <h2 id="venue-event-tiers">Ticket tiers</h2>
          </div>
          <span className={styles['tierCount']}>{tiers.length} tiers</span>
        </div>
        {tiers.length ? (
          <div className={styles['tierList']}>
            {tiers.map((tier) => (
              <article className={styles['tier']} key={tier.id}>
                <div className={styles['tierTop']}>
                  <h3>{tier.name}</h3>
                  <strong>{currency(tier.priceInPaise, tier.currency)}</strong>
                </div>
                <dl className={styles['tierFacts']}>
                  <div>
                    <dt>Capacity</dt>
                    <dd>{tier.quantity.toLocaleString('en-IN')}</dd>
                  </div>
                  {tier.maxPerOrder !== null ? (
                    <div>
                      <dt>Order limit</dt>
                      <dd>{tier.maxPerOrder} per order</dd>
                    </div>
                  ) : null}
                </dl>
                {tier.pricingPhases?.length ? (
                  <div className={styles['phases']}>
                    {tier.pricingPhases.map((phase) => (
                      <div className={styles['phase']} key={phase.id}>
                        <span>{phase.name}</span>
                        <strong>{currency(phase.priceInPaise, tier.currency)}</strong>
                        <small>
                          {dateTime.format(new Date(phase.startsAt))} –{' '}
                          {dateTime.format(new Date(phase.endsAt))} IST
                        </small>
                      </div>
                    ))}
                  </div>
                ) : null}
                {tier.salesStartAt || tier.salesEndAt ? (
                  <p className={styles['salesWindow']}>
                    Sales window:{' '}
                    {tier.salesStartAt ? dateTime.format(new Date(tier.salesStartAt)) : 'Open'}
                    {' – '}
                    {tier.salesEndAt ? dateTime.format(new Date(tier.salesEndAt)) : 'No end'} IST
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className={styles['empty']}>No ticket tiers are configured.</p>
        )}
      </section>

      {event.media ? (
        <section className={styles['panel']} aria-labelledby="venue-event-media">
          <div className={styles['sectionHeading']}>
            <div>
              <p className={styles['eyebrow']}>Gallery</p>
              <h2 id="venue-event-media">Event media</h2>
            </div>
          </div>
          {event.media.youtubeUrl ? (
            <p className={styles['mediaLink']}>
              Video: <a href={event.media.youtubeUrl}>{event.media.youtubeUrl}</a>
            </p>
          ) : null}
          {event.media.gallery.length ? (
            <div className={styles['gallery']}>
              {event.media.gallery.map((image) => (
                <figure key={image.url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.alt} />
                  <figcaption>{image.alt}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

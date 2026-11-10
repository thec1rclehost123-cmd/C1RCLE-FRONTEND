import styles from './connected-event-summary.module.css';

import type { EventAnalyticsDto, TicketTierDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function ConnectedEventSummary({
  analytics,
  tiers,
}: {
  readonly analytics: EventAnalyticsDto;
  readonly tiers: readonly TicketTierDto[];
}) {
  const maxSold = Math.max(0, ...tiers.map((tier) => tier.soldQuantity ?? 0));

  return (
    <div className={styles['summary']}>
      <section className={styles['metrics']} aria-label="Event sales summary">
        <article className={styles['metric']}>
          <span>Money made</span>
          <strong>{money.format(analytics.totalRevenuePaise / 100)}</strong>
        </article>
        <article className={styles['metric']}>
          <span>Tickets sold</span>
          <div className={styles['ticketTotal']}>
            <strong>{analytics.ticketsSold.toLocaleString('en-IN')}</strong>
            <span>/ {analytics.totalTicketInventory.toLocaleString('en-IN')}</span>
          </div>
        </article>
        <article className={styles['metric']}>
          <span>Refunds</span>
          <strong className={styles['refund']}>{money.format(analytics.refundAmountPaise / 100)}</strong>
        </article>
      </section>

      <section className={styles['tiers']} aria-labelledby="event-ticket-tiers-title">
        <h2 id="event-ticket-tiers-title">Tickets by tier</h2>
        {tiers.length === 0 ? (
          <p className={styles['empty']}>Ticket tiers are not available for this event.</p>
        ) : (
          <div className={styles['tierList']}>
            {tiers.map((tier, index) => {
              const sold = tier.soldQuantity ?? 0;
              const available = tier.availableQuantity;
              const tone = index % 3;

              return (
                <div className={styles['tier']} key={tier.id}>
                  <div className={styles['tierHeader']}>
                    <span>{tier.name}</span>
                    <strong>
                      {sold.toLocaleString('en-IN')} sold
                      {available !== undefined
                        ? ` · ${available.toLocaleString('en-IN')} left`
                        : ''}
                    </strong>
                  </div>
                  <progress
                    className={[
                      styles['track'] ?? '',
                      tone === 0 ? styles['fill0'] ?? '' : '',
                      tone === 1 ? styles['fill1'] ?? '' : '',
                      tone === 2 ? styles['fill2'] ?? '' : '',
                    ].filter(Boolean).join(' ')}
                    aria-label={`${tier.name} tickets sold`}
                    max={maxSold || 1}
                    value={sold}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

import { RefundIcon, TicketIcon, TrendUpIcon } from '@c1rcle/icons';

import styles from './event-detail.module.css';
import { EventDetailSection } from './EventDetailSection';
import { EventSummaryCard } from './EventSummaryCard';

import type { EventSalesSummary as EventSalesSummaryData } from '@/data/partner-data-source';

export function EventSalesSummary({
  summary,
  accent = 'orange',
}: {
  readonly summary: EventSalesSummaryData;
  readonly accent?: 'orange' | 'lavender';
}) {
  return (
    <>
      <EventDetailSection title="Sales summary">
        <div className={styles['summaryGrid']}>
          <EventSummaryCard
            accent={accent}
            label="Money made"
            value={summary.moneyMade}
            delta={summary.moneyDelta}
            trendPoints={summary.moneyTrend}
            icon={<TrendUpIcon size={13} aria-hidden="true" />}
          />
          <EventSummaryCard
            accent={accent}
            label="Tickets sold"
            value={summary.ticketsSold}
            icon={<TicketIcon size={13} aria-hidden="true" />}
          />
          <EventSummaryCard
            accent={accent}
            label="Refunds"
            value={summary.refunds}
            icon={<RefundIcon size={13} aria-hidden="true" />}
          />
        </div>
      </EventDetailSection>

      <EventDetailSection title="Tickets by tier">
        <div className={styles['tierList']}>
          {summary.tiers.map((tier) => (
            <div className={styles['tierRow']} key={tier.name}>
              <div className={styles['tierRowHeader']}>
                <span>{tier.name}</span>
                <strong>
                  {tier.count} · {tier.money}
                </strong>
              </div>
              <div className={styles['tierTrack']}>
                <span
                  className={[
                    styles[`tierFill${tier.accent.charAt(0).toUpperCase()}${tier.accent.slice(1)}`],
                    tierWidthClasses[tier.fillPercent],
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              </div>
            </div>
          ))}
        </div>
      </EventDetailSection>
    </>
  );
}

const tierWidthClasses: Readonly<Record<number, string>> = {
  25: styles['tierWidth25'] ?? '',
  35: styles['tierWidth35'] ?? '',
  38: styles['tierWidth38'] ?? '',
  40: styles['tierWidth40'] ?? '',
  42: styles['tierWidth42'] ?? '',
  52: styles['tierWidth52'] ?? '',
  58: styles['tierWidth58'] ?? '',
  60: styles['tierWidth60'] ?? '',
  70: styles['tierWidth70'] ?? '',
  76: styles['tierWidth76'] ?? '',
  82: styles['tierWidth82'] ?? '',
  94: styles['tierWidth94'] ?? '',
  100: styles['tierWidth100'] ?? '',
};

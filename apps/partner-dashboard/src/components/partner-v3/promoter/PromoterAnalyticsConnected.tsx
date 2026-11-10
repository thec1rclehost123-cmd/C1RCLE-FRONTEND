import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from '../event-detail/partner-analytics.module.css';

import type { PromoterCampaignSummaryDto } from '@c1rcle/contracts';

const valueToneClasses = {
  positive: styles['valuePositive'] ?? '',
  negative: styles['valueNegative'] ?? '',
  neutral: styles['valueNeutral'] ?? '',
} as const;

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-IN');
const inr = (paise: number) => money.format(paise / 100);

export function PromoterAnalyticsConnected({
  summary,
}: {
  readonly summary: PromoterCampaignSummaryDto;
}) {
  const conversionRate = summary.clicks > 0 ? (summary.conversions / summary.clicks) * 100 : 0;
  const conversionWidth =
    summary.clicks > 0 ? Math.min((summary.conversions / summary.clicks) * 100, 100) : 0;

  return (
    <PageContainer>
      <main className={styles['page']}>
        <header className={styles['header']}>
          <div>
            <h1>Analytics</h1>
            <span>Promoter performance</span>
          </div>
          <div className={styles['promoterHeaderActions']}>
            <span className={styles['rangePill']}>All time</span>
            <Link href="/partner/promoter/events">View campaigns</Link>
          </div>
        </header>

        <section className={styles['stats']} aria-label="Promoter analytics summary">
          <Metric label="Referral links" value={number.format(summary.linkCount)} />
          <Metric label="Clicks" value={number.format(summary.clicks)} />
          <Metric label="Conversions" value={number.format(summary.conversions)} />
          <Metric
            label="Gross attributed sales"
            value={inr(summary.grossAttributedTicketSalesPaise)}
            tone={summary.grossAttributedTicketSalesPaise > 0 ? 'positive' : 'neutral'}
          />
          <Metric
            label="Refunded value"
            value={inr(summary.refundedAttributedTicketSalesPaise)}
            tone={summary.refundedAttributedTicketSalesPaise > 0 ? 'negative' : 'neutral'}
          />
          <Metric
            label="Net attributed sales"
            value={inr(summary.netAttributedTicketSalesPaise)}
            tone={summary.netAttributedTicketSalesPaise > 0 ? 'positive' : 'neutral'}
          />
        </section>

        <section className={styles['promoterChart']} aria-labelledby="promoter-funnel-title">
          <div className={styles['panelHeading']}>
            <h2 id="promoter-funnel-title">Link performance</h2>
            <strong
              className={conversionRate > 0 ? styles['valuePositive'] : styles['valueNeutral']}
            >
              {conversionRate.toFixed(1)}% conversion
            </strong>
          </div>
          <div className={styles['funnelRow']}>
            <div>
              <span>Clicks</span>
              <strong>{number.format(summary.clicks)}</strong>
            </div>
            <svg
              className={styles['funnelTrack']}
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              role="img"
              aria-label={`${number.format(summary.conversions)} conversions from ${number.format(summary.clicks)} clicks`}
            >
              <rect
                className={styles['funnelTrackBackground']}
                x="0"
                y="0"
                width="100"
                height="10"
                rx="5"
              />
              <rect
                className={styles['funnelTrackValue']}
                x="0"
                y="0"
                width={conversionWidth}
                height="10"
                rx="5"
              />
            </svg>
            <div>
              <span>Conversions</span>
              <strong>{number.format(summary.conversions)}</strong>
            </div>
          </div>
          <div className={styles['funnelLegend']}>
            <span>Conversion rate</span>
            <strong>{conversionRate.toFixed(1)}%</strong>
          </div>
        </section>

        <section className={styles['promoterValue']}>
          <div>
            <h2>Commission recorded</h2>
            <strong
              className={summary.recordedCommissionPaise > 0 ? styles['valuePositive'] : undefined}
            >
              {inr(summary.recordedCommissionPaise)}
            </strong>
          </div>
          <span
            className={
              summary.reversedCommissionPaise && summary.reversedCommissionPaise > 0
                ? styles['valueNegative']
                : undefined
            }
          >
            {summary.reversedCommissionPaise === null
              ? 'Historical commission from order snapshots'
              : `${inr(summary.reversedCommissionPaise)} reversed in the finance journal`}
          </span>
        </section>
        <p className={styles['limitNotice']}>
          RSVPs: {number.format(summary.activeRsvpCount)} active of{' '}
          {number.format(summary.historicalRsvpConversions)} historical acquisitions.
        </p>
        {!summary.complete || !summary.refundValueComplete ? (
          <p className={styles['limitNotice']} role="status">
            {!summary.refundValueComplete
              ? 'Settled refund value is incomplete because a refund journal is missing. '
              : ''}
            {summary.hasMoreLinks || summary.hasMoreOrders
              ? 'Totals cover the first 1,000 links and attributed orders.'
              : ''}
          </p>
        ) : null}
      </main>
    </PageContainer>
  );
}

function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  readonly label: string;
  readonly value: string;
  readonly tone?: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <div className={styles['stat']}>
      <span>{label}</span>
      <strong className={valueToneClasses[tone]} data-tone={tone}>
        {value}
      </strong>
    </div>
  );
}

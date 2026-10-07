import Link from 'next/link';

import {
  RequestPayoutIcon,
  ScheduledPayoutIcon,
  SettingsIcon,
  TrendUpIcon,
  WithdrawIcon,
} from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';

import styles from './finance.module.css';
import { FinanceMetric } from './FinanceMetric';

import type { PartnerFinanceData } from '@/data/partner-data-source';

function linePath(points: readonly number[], width = 600, height = 190): string {
  if (points.length === 0) return '';
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const spread = Math.max(max - min, 1);
  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - ((point - min) / spread) * (height - 20) - 10;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function areaPath(points: readonly number[], width = 600, height = 190): string {
  const path = linePath(points, width, height);
  return path ? `${path} L ${String(width)} ${String(height)} L 0 ${String(height)} Z` : '';
}

export function FinanceSummary({
  data,
  bankHref,
}: {
  readonly data: PartnerFinanceData;
  readonly bankHref: string;
}) {
  const sparkLine = linePath(data.balanceTrend);
  const sparkArea = areaPath(data.balanceTrend);

  return (
    <div className={styles['financeSummary']}>
      <div className={styles['financeTopGrid']}>
        <section className={styles['balanceHero']} aria-labelledby="available-balance-title">
          <div className={styles['balanceGlow']} aria-hidden="true" />
          <svg
            className={styles['balanceSparkline']}
            viewBox="0 0 600 190"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="finance-balance-spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--finance-accent)" stopOpacity=".4" />
                <stop offset="100%" stopColor="var(--finance-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={sparkArea} fill="url(#finance-balance-spark)" />
            <path d={sparkLine} className={styles['balanceSparkLine']} />
          </svg>
          <div className={styles['balanceContent']}>
            <div className={styles['balanceLabelRow']}>
              <span id="available-balance-title">Available balance</span>
              <span className={styles['balanceDelta']}>
                <TrendUpIcon size={12} aria-hidden="true" />
                {data.balanceDelta}
              </span>
            </div>
            <strong className={styles['balanceValue']}>{data.availableBalance}</strong>
            <p>{data.balanceDetail}</p>
            <div className={styles['balanceActions']}>
              <Button
                className={styles['financePrimaryAction']}
                variant="primary"
                disabled
                title="Withdrawals require the payout mutation API."
              >
                <WithdrawIcon size={16} aria-hidden="true" /> Withdraw
              </Button>
              <Button
                className={styles['financeSecondaryAction']}
                variant="secondary"
                disabled
                title="Payout requests require the payout mutation API."
              >
                <RequestPayoutIcon size={16} aria-hidden="true" /> Request payout
              </Button>
            </div>
          </div>
        </section>

        <section className={styles['bankCard']} aria-label="Payout bank account">
          <div className={styles['bankCardGlow']} aria-hidden="true" />
          <div className={styles['bankCardTop']}>
            <div>
              <span className={styles['bankCardLabel']}>THE C1RCLE · PAYOUTS</span>
              <strong>{data.bankAccount.bankName}</strong>
            </div>
            <span className={styles['bankChip']} aria-hidden="true" />
          </div>
          <div className={styles['bankCardBottom']}>
            <strong className={styles['bankNumber']}>{data.bankAccount.displayNumber}</strong>
            <div className={styles['bankCardIdentity']}>
              <span>
                <small>ACCOUNT HOLDER</small>
                <strong>{data.bankAccount.accountHolder}</strong>
              </span>
              <Link href={bankHref}>
                <SettingsIcon size={14} aria-hidden="true" /> Manage
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className={styles['financeMetricGrid']}>
        <FinanceMetric
          metric={data.pendingBalance}
          icon={<span className={styles['hourglassIcon']}>⌛</span>}
        />
        <FinanceMetric metric={data.nextPayout} icon={<ScheduledPayoutIcon size={20} />} />
      </div>
    </div>
  );
}

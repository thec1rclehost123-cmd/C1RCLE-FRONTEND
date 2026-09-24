import styles from './finance.module.css';

import type { FinanceMetric as FinanceMetricData } from '@/data/partner-data-source';
import type { ReactNode } from 'react';

export function FinanceMetric({
  metric,
  icon,
}: {
  readonly metric: FinanceMetricData;
  readonly icon: ReactNode;
}) {
  const toneClass =
    metric.tone === 'positive'
      ? styles['financeMetricPositive']
      : metric.tone === 'warning'
        ? styles['financeMetricWarning']
        : '';

  return (
    <article className={styles['financeMetric']}>
      <span
        className={[styles['financeMetricIcon'], toneClass].filter(Boolean).join(' ')}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className={styles['financeMetricCopy']}>
        <span>{metric.label}</span>
        <strong>{metric.value}</strong>
      </div>
      <small>{metric.detail}</small>
    </article>
  );
}

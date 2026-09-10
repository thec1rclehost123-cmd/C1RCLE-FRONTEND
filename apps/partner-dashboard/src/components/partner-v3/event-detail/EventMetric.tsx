import styles from './event-detail.module.css';

import type { ReactNode } from 'react';

export function EventMetric({
  label,
  value,
  suffix,
  tone = 'default',
  icon,
}: {
  readonly label: string;
  readonly value: string;
  readonly suffix?: string | undefined;
  readonly tone?: 'default' | 'success';
  readonly icon?: ReactNode;
}) {
  return (
    <div className={styles['detailMetric']}>
      <div className={styles['detailMetricLabel']}>
        <span>{label}</span>
        {icon ? <span className={styles['detailMetricIcon']}>{icon}</span> : null}
      </div>
      <div
        className={[
          styles['detailMetricValue'],
          tone === 'success' ? styles['detailMetricValueSuccess'] : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
        {suffix ? <span>{suffix}</span> : null}
      </div>
    </div>
  );
}

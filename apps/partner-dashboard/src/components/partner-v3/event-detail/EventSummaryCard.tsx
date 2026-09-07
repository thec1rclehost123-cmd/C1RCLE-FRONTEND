import styles from './event-detail.module.css';

import type { ReactNode } from 'react';

export function EventSummaryCard({ label, value, detail, delta, trendPoints, icon, accent = 'orange' }: { readonly label: string; readonly value: string; readonly detail?: string | undefined; readonly delta?: string | undefined; readonly trendPoints?: readonly number[] | undefined; readonly icon?: ReactNode; readonly accent?: 'orange' | 'lavender' }) {
  return (
    <article className={[styles['summaryCard'], accent === 'lavender' ? styles['summaryCardLavender'] : ''].filter(Boolean).join(' ')}>
      <div className={styles['summaryLabel']}><span>{label}</span>{icon ? <span className={styles['summaryIcon']}>{icon}</span> : null}</div>
      <div className={styles['summaryValueRow']}>
        <strong>{value}</strong>
        {delta ? <span className={styles['summaryDelta']}>{delta}</span> : null}
      </div>
      {detail ? <span className={styles['summaryDetail']}>{detail}</span> : null}
      {trendPoints ? <Sparkline points={trendPoints} /> : null}
    </article>
  );
}

function Sparkline({ points }: { readonly points: readonly number[] }) {
  const path = buildSparklinePath(points);
  return (
    <svg className={styles['summarySparkline']} viewBox="0 0 600 190" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${path} L 600 190 L 0 190 Z`} className={styles['summarySparkArea']} />
      <path d={path} className={styles['summarySparkLine']} />
    </svg>
  );
}

function buildSparklinePath(points: readonly number[]) {
  if (points.length === 0) return '';
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const spread = Math.max(max - min, 1);
  return points.map((point, index) => {
    const x = points.length === 1 ? 300 : (index / (points.length - 1)) * 600;
    const y = 170 - ((point - min) / spread) * 135;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

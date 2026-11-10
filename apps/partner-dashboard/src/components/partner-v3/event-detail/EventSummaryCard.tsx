import styles from './event-detail.module.css';

import type { ReactNode } from 'react';

export function EventSummaryCard({
  label,
  value,
  valueSuffix,
  detail,
  delta,
  trendPoints,
  icon,
  accent = 'orange',
  tone = 'neutral',
}: {
  readonly label: string;
  readonly value: string;
  readonly valueSuffix?: string | undefined;
  readonly detail?: string | undefined;
  readonly delta?: string | undefined;
  readonly trendPoints?: readonly number[] | undefined;
  readonly icon?: ReactNode;
  readonly accent?: 'orange' | 'lavender';
  readonly tone?: 'positive' | 'negative' | 'neutral';
}) {
  const deltaValue = delta ? Number.parseFloat(delta.replace('%', '').replace('+', '')) : Number.NaN;
  const trendTone =
    delta === 'New' || deltaValue > 0
      ? 'positive'
      : deltaValue < 0
        ? 'negative'
        : 'neutral';
  return (
    <article
      className={[styles['summaryCard'], accent === 'lavender' ? styles['summaryCardLavender'] : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles['summaryLabel']}>
        <span>{label}</span>
        {icon ? <span className={styles['summaryIcon']}>{icon}</span> : null}
      </div>
      <div className={styles['summaryValueRow']}>
        <strong className={styles[`summaryValue-${tone}`]}>{value}</strong>
        {valueSuffix ? <span className={styles['summaryValueSuffix']}>{valueSuffix}</span> : null}
        {delta ? <span className={[styles['summaryDelta'], styles[`summaryDelta-${trendTone}`]].join(' ')} data-trend={trendTone}>{delta}</span> : null}
      </div>
      {detail ? <span className={styles['summaryDetail']}>{detail}</span> : null}
      {trendPoints ? <Sparkline points={trendPoints} tone={trendTone} /> : null}
    </article>
  );
}

function Sparkline({ points, tone }: { readonly points: readonly number[]; readonly tone: 'positive' | 'negative' | 'neutral' }) {
  const path = buildSparklinePath(points);
  return (
    <svg
      className={styles['summarySparkline']}
      viewBox="0 0 600 190"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={`${path} L 600 190 L 0 190 Z`} className={[styles['summarySparkArea'], styles[`summarySparkArea-${tone}`]].join(' ')} />
      <path d={path} className={[styles['summarySparkLine'], styles[`summarySparkLine-${tone}`]].join(' ')} />
    </svg>
  );
}

function buildSparklinePath(points: readonly number[]) {
  if (points.length === 0) return '';
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const spread = Math.max(max - min, 1);
  return points
    .map((point, index) => {
      const x = points.length === 1 ? 300 : (index / (points.length - 1)) * 600;
      const y = 170 - ((point - min) / spread) * 135;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

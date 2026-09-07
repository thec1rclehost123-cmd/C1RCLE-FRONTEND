'use client';

import { useMemo, useState } from 'react';

import { TrendUpIcon } from '@c1rcle/icons';

import styles from './overview.module.css';

import type { OverviewTrendMetric, OverviewTrendRange, OverviewTrendSeries } from '@/data/partner-data-source';


const metrics: readonly OverviewTrendMetric[] = ['tickets', 'revenue'];
const ranges: readonly OverviewTrendRange[] = ['1D', '1W', '1M', 'All'];

const defaultMetricLabels: Readonly<Record<OverviewTrendMetric, string>> = {
  tickets: 'Tickets',
  revenue: 'Revenue',
  clicks: 'Clicks',
};

function chartPaths(points: readonly number[]) {
  const width = 600;
  const height = 190;
  const top = 10;
  const bottom = 180;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(max - min, 1);
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: bottom - ((point - min) / span) * (bottom - top),
  }));
  const line = coordinates.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = [line, 'L', String(width), String(height), 'L 0', String(height), 'Z'].join(' ');
  return { line, area };
}

export function OverviewTrendCard({
  series,
  title = 'Performance',
  summaryLabel,
  summaryValue,
  metricOptions = metrics,
  rangeOptions = ranges,
  metricLabels = defaultMetricLabels,
  initialMetric = 'tickets',
  initialRange = '1W',
  className,
  rangePlacement = 'top',
  showMetricSummary = true,
  axisLabels,
  chartClassName,
}: {
  readonly series: readonly OverviewTrendSeries[];
  readonly title?: string;
  readonly summaryLabel?: string;
  readonly summaryValue?: string;
  readonly metricOptions?: readonly OverviewTrendMetric[];
  readonly rangeOptions?: readonly OverviewTrendRange[];
  readonly metricLabels?: Readonly<Record<OverviewTrendMetric, string>>;
  readonly initialMetric?: OverviewTrendMetric;
  readonly initialRange?: OverviewTrendRange;
  readonly className?: string | undefined;
  readonly rangePlacement?: 'top' | 'bottom';
  readonly showMetricSummary?: boolean;
  readonly axisLabels?: readonly string[] | undefined;
  readonly chartClassName?: string | undefined;
}) {
  const [metric, setMetric] = useState<OverviewTrendMetric>(initialMetric);
  const [range, setRange] = useState<OverviewTrendRange>(initialRange);
  const active = series.find((entry) => entry.metric === metric && entry.range === range) ?? series[0];
  const paths = useMemo(() => chartPaths(active?.points ?? [0]), [active]);

  if (!active) return null;

  return (
    <section className={[styles['card'], styles['trendCard'], className].filter(Boolean).join(' ')} aria-labelledby="overview-performance-title">
      <div className={styles['trendControls']}>
        <div>
          <h2 className={styles['trendTitle']}>{title}</h2>
          <div className={styles['segmentedControl']} aria-label="Performance metric">
          {metricOptions.map((option) => (
            <button key={option} type="button" aria-pressed={metric === option} onClick={() => { setMetric(option); }}>
              {metricLabels[option]}
            </button>
          ))}
          </div>
        </div>
        {summaryLabel && summaryValue ? <div className={styles['trendSummary']}><span>{summaryLabel}</span><strong>{summaryValue}</strong></div> : null}
      </div>
      {rangePlacement === 'top' ? <div className={styles['trendRangeRow']}>
        <div className={styles['segmentedControl']} aria-label="Performance range">
          {rangeOptions.map((option) => (
            <button key={option} type="button" aria-pressed={range === option} onClick={() => { setRange(option); }}>
              {option === 'All' ? 'ALL' : option}
            </button>
          ))}
        </div>
      </div> : null}
      {showMetricSummary ? <>
        <div className={styles['trendMetric']}>
          <h2 id="overview-performance-title">{active.value}</h2>
          <span><TrendUpIcon size={13} aria-hidden="true" />{active.delta}</span>
        </div>
        <p>{active.caption}</p>
      </> : null}
      <svg className={[styles['chart'], chartClassName].filter(Boolean).join(' ')} viewBox="0 0 600 190" preserveAspectRatio="none" role="img" aria-label={`${metric} ${range} trend: ${active.value}, ${active.delta}`}>
        <defs>
          <linearGradient id="overview-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--overview-accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--overview-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={paths.area} fill="url(#overview-area-fill)" />
        <path d={paths.line} fill="none" stroke="var(--overview-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {axisLabels ? <div className={styles['chartAxisLabels']}>{axisLabels.map((label) => <span key={label}>{label}</span>)}</div> : null}
      {rangePlacement === 'bottom' ? <div className={[styles['trendRangeRow'], styles['trendRangeBottom']].join(' ')}>
        <div className={styles['segmentedControl']} aria-label="Performance range">
          {rangeOptions.map((option) => (
            <button key={option} type="button" aria-pressed={range === option} onClick={() => { setRange(option); }}>
              {option === 'All' ? 'ALL' : option}
            </button>
          ))}
        </div>
      </div> : null}
    </section>
  );
}

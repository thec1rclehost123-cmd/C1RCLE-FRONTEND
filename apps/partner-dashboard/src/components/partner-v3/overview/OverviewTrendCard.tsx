'use client';

import { useId, useMemo, useState } from 'react';

import { TrendUpIcon } from '@c1rcle/icons';

import styles from './overview.module.css';

import type {
  OverviewTrendMetric,
  OverviewTrendRange,
  OverviewTrendSeries,
} from '@/data/partner-data-source';

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
  const peak = Math.max(0, ...points);
  const magnitude = 10 ** Math.floor(Math.log10(peak || 1));
  const max = Math.max(2, Math.ceil((Math.ceil(peak / magnitude) * magnitude) / 2) * 2);
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: bottom - (point / max) * (bottom - top),
  }));
  const line = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const area = [line, 'L', String(width), String(height), 'L 0', String(height), 'Z'].join(' ');
  return { line, area, coordinates, max };
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
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const [metric, setMetric] = useState<OverviewTrendMetric>(initialMetric);
  const [range, setRange] = useState<OverviewTrendRange>(initialRange);
  const active =
    series.find((entry) => entry.metric === metric && entry.range === range) ?? series[0];
  const paths = useMemo(() => chartPaths(active?.points.length ? active.points : [0]), [active]);

  if (!active) return null;
  const points = active.points.length ? active.points : [0];
  const labels =
    active.pointLabels?.length === points.length
      ? active.pointLabels
      : axisLabels?.length === points.length
        ? axisLabels
        : points.map((_, index) => `Interval ${String(index + 1)}`);
  const selectedIndex = hovered === null ? null : Math.min(hovered, points.length - 1);
  const selected = selectedIndex === null ? null : paths.coordinates[selectedIndex];
  const formatValue = (value: number) =>
    metric === 'revenue'
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2,
        }).format(value)
      : value.toLocaleString('en-IN');
  const ticks = [
    ...new Set(
      Array.from({ length: Math.min(5, points.length) }, (_, index) =>
        Math.round((index * (points.length - 1)) / Math.max(Math.min(5, points.length) - 1, 1)),
      ),
    ),
  ];

  return (
    <section
      className={[styles['card'], styles['trendCard'], className].filter(Boolean).join(' ')}
      aria-labelledby="overview-performance-title"
    >
      <header className={styles['trendHeader']}>
        <h2 className={styles['trendTitle']}>{title}</h2>
        {summaryLabel && summaryValue ? (
          <div className={styles['trendSummary']}>
            <span>{summaryLabel}</span>
            <strong>{summaryValue}</strong>
          </div>
        ) : null}
      </header>
      <div className={styles['trendControls']}>
        <div className={styles['segmentedControl']} aria-label="Performance metric">
          {metricOptions.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={metric === option}
              onClick={() => {
                setMetric(option);
                setHovered(null);
              }}
            >
              {metricLabels[option]}
            </button>
          ))}
        </div>
        {rangePlacement === 'top' ? (
          <div className={styles['segmentedControl']} aria-label="Performance range">
            {rangeOptions.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={range === option}
                onClick={() => {
                  setRange(option);
                  setHovered(null);
                }}
              >
                {option === 'All' ? 'ALL' : option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {showMetricSummary ? (
        <>
          <div className={styles['trendMetric']}>
            <h2 id="overview-performance-title">{active.value}</h2>
            <span>
              <TrendUpIcon size={13} aria-hidden="true" />
              {active.delta}
            </span>
          </div>
          <p>{active.caption}</p>
        </>
      ) : null}
      <div className={styles['interactiveChart']}>
        <div className={styles['chartValueAxis']} aria-label={`${metricLabels[metric]} scale`}>
          <span>{formatValue(paths.max)}</span>
          <span>{formatValue(paths.max / 2)}</span>
          <span>0</span>
        </div>
        <div className={styles['chartPlot']}>
          <svg
            className={[styles['chart'], chartClassName].filter(Boolean).join(' ')}
            viewBox="0 0 600 190"
            preserveAspectRatio="none"
            role="img"
            tabIndex={0}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setHovered(
                Math.round(
                  Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) *
                    (points.length - 1),
                ),
              );
            }}
            onPointerLeave={() => {
              setHovered(null);
            }}
            onFocus={() => {
              setHovered(0);
            }}
            onBlur={() => {
              setHovered(null);
            }}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              setHovered(
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? points.length - 1
                    : Math.max(
                        0,
                        Math.min(
                          points.length - 1,
                          (hovered ?? 0) + (event.key === 'ArrowRight' ? 1 : -1),
                        ),
                      ),
              );
            }}
            aria-describedby={selectedIndex === null ? undefined : `${gradientId}-tooltip`}
            aria-label={`${metric} ${range} trend: ${active.value}, ${active.delta}`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--overview-accent)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--overview-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[10, 95, 180].map((y) => (
              <line
                key={y}
                x1="0"
                x2="600"
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray={y === 180 ? undefined : '3 5'}
              />
            ))}
            <path d={paths.area} fill={`url(#${gradientId})`} />
            <path
              d={paths.line}
              fill="none"
              stroke="var(--overview-accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {selected ? (
              <>
                <line
                  x1={selected.x}
                  x2={selected.x}
                  y1="10"
                  y2="180"
                  stroke="rgba(255,255,255,0.35)"
                  strokeDasharray="3 4"
                />
                <circle
                  cx={selected.x}
                  cy={selected.y}
                  r="4"
                  fill="var(--overview-accent)"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </>
            ) : null}
          </svg>
          {selected && selectedIndex !== null ? (
            <div
              role="tooltip"
              id={`${gradientId}-tooltip`}
              className={styles['chartTooltip']}
              data-align={selected.x < 200 ? 'start' : selected.x > 400 ? 'end' : 'center'}
            >
              <span>
                {labels[selectedIndex]}
                {range === '1D' ? ' IST' : ''}
              </span>
              <strong>
                {formatValue(points[selectedIndex] ?? 0)}{' '}
                {metric === 'revenue' ? '' : metricLabels[metric].toLowerCase()}
              </strong>
            </div>
          ) : null}
          <div className={styles['chartTimeAxis']} aria-label="Time axis">
            <svg width="100%" height="30" aria-hidden="true">
              {ticks.map((index) => (
                <text
                  key={index}
                  x={`${String(points.length === 1 ? 50 : (index / (points.length - 1)) * 100)}%`}
                  y="14"
                  textAnchor={
                    index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'
                  }
                >
                  {range === '1D'
                    ? labels[index]?.split(' – ')[0]?.split(', ').at(-1)
                    : labels[index]?.split(' – ')[0]}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>
      {rangePlacement === 'bottom' ? (
        <div className={[styles['trendRangeRow'], styles['trendRangeBottom']].join(' ')}>
          <div className={styles['segmentedControl']} aria-label="Performance range">
            {rangeOptions.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={range === option}
                onClick={() => {
                  setRange(option);
                  setHovered(null);
                }}
              >
                {option === 'All' ? 'ALL' : option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

import Link from 'next/link';
import { Suspense } from 'react';

import { venueEventsAnalyticsModel } from '../venue-events-analytics-model';

import styles from './VenueEventsAnalytics.module.css';
import { VenueEventsAnalyticsFilters } from './VenueEventsAnalyticsFilters';

import type { VenueEventsAnalyticsViewModel } from '../venue-events-analytics-model';

const chartWidth = 650;
const chartHeight = 220;
const chartMaximum = 200_000;

const classNames = (...tokens: readonly (string | undefined)[]): string =>
  tokens.filter((token): token is string => Boolean(token)).join(' ');

const chartPoint = (value: number, index: number, count: number) => ({
  x: (index / Math.max(count - 1, 1)) * chartWidth,
  y: chartHeight - (Math.min(value, chartMaximum) / chartMaximum) * chartHeight,
});

const chartPath = (values: readonly number[]): string =>
  values
    .map((value, index) => {
      const point = chartPoint(value, index, values.length);
      return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(' ');

export function VenueEventsAnalyticsScreen() {
  return <VenueEventsAnalyticsContent model={venueEventsAnalyticsModel} />;
}

export function VenueEventsAnalyticsContent({
  model,
}: {
  readonly model: VenueEventsAnalyticsViewModel | null;
}) {
  if (!model) {
    return (
      <section className={styles['emptyState']}>
        <span>Analytics unavailable</span>
        <h1>There is no Events Analytics report yet.</h1>
        <p>Paid order and ticket aggregates are required before this report can render.</p>
        <Link href="/venue/events">Return to events</Link>
      </section>
    );
  }

  return (
    <div className={styles['page']}>
      <header className={styles['pageHeader']}>
        <div>
          <h1>Cumulative analytics</h1>
          <p>Venue-wide performance across events and hosts.</p>
        </div>
        <Suspense
          fallback={<div className={styles['analyticsFiltersFallback']} aria-hidden="true" />}
        >
          <VenueEventsAnalyticsFilters
            rows={model.metrics.map((metric) => ({ label: metric.label, value: metric.value }))}
          />
        </Suspense>
      </header>

      <section className={styles['metrics']} aria-label="Events Analytics summary">
        {model.metrics.map((metric) => {
          const [change, comparisonPeriod] = metric.comparison.split(' vs ');
          return (
            <article key={metric.label} title={metric.definition}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>
                <b>{change}</b>
                {comparisonPeriod ? ` vs ${comparisonPeriod}` : null}
              </small>
            </article>
          );
        })}
      </section>

      <div className={styles['primaryGrid']}>
        <SalesPanel sales={model.sales} />
        <AgePanel model={model} />
      </div>

      <WhoIsComingPanel model={model} />
    </div>
  );
}

function SalesPanel({ sales }: { readonly sales: VenueEventsAnalyticsViewModel['sales'] }) {
  const currentPath = chartPath(sales.current);
  const previousPath = chartPath(sales.previous);

  return (
    <section
      className={classNames(styles['panel'], styles['salesPanel'])}
      aria-labelledby="sales-title"
    >
      <h2 id="sales-title">Sales</h2>
      <p className={styles['srOnly']}>{sales.accessibleSummary}</p>
      <div className={styles['chart']}>
        <div className={styles['yLabels']} aria-hidden="true">
          <span>₹2.0L</span>
          <span>₹1.5L</span>
          <span>₹1.0L</span>
          <span>₹50K</span>
          <span>₹0</span>
        </div>
        <svg
          viewBox={`0 0 ${String(chartWidth)} ${String(chartHeight)}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={sales.accessibleSummary}
        >
          <g className={styles['gridLines']} aria-hidden="true">
            <line x1="0" y1="0" x2={chartWidth} y2="0" />
            <line x1="0" y1="55" x2={chartWidth} y2="55" />
            <line x1="0" y1="110" x2={chartWidth} y2="110" />
            <line x1="0" y1="165" x2={chartWidth} y2="165" />
            <line x1="0" y1="220" x2={chartWidth} y2="220" />
          </g>
          <path className={styles['previousLine']} d={previousPath} />
          <path className={styles['currentLine']} d={currentPath} />
          {sales.previous.map((value, index) => {
            const point = chartPoint(value, index, sales.previous.length);
            return (
              <circle
                className={styles['previousPoint']}
                key={`previous-${String(index)}`}
                cx={point.x}
                cy={point.y}
                r="4"
              >
                <title>{`${sales.previousLabel}, ${sales.labels[index] ?? ''}: ₹${value.toLocaleString('en-IN')}`}</title>
              </circle>
            );
          })}
          {sales.current.map((value, index) => {
            const point = chartPoint(value, index, sales.current.length);
            return (
              <circle key={`current-${String(index)}`} cx={point.x} cy={point.y} r="5">
                <title>{`${sales.currentLabel}, ${sales.labels[index] ?? ''}: ₹${value.toLocaleString('en-IN')}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className={styles['xLabels']} aria-hidden="true">
          {sales.labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgePanel({ model }: { readonly model: VenueEventsAnalyticsViewModel }) {
  return (
    <section
      className={classNames(styles['panel'], styles['agePanel'])}
      aria-labelledby="age-title"
    >
      <h2 id="age-title">Guest age</h2>
      {model.demographics ? (
        <div className={styles['ageBars']}>
          {model.demographics.age.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <progress
                value={item.percent}
                max={100}
                aria-label={`${item.label}: ${String(item.percent)}%`}
              />
              <strong>{item.percent}%</strong>
            </div>
          ))}
        </div>
      ) : (
        <DemographicsUnavailable message={model.demographicUnavailableReason} />
      )}
    </section>
  );
}

function WhoIsComingPanel({ model }: { readonly model: VenueEventsAnalyticsViewModel }) {
  const genderSegments = model.demographics?.gender.map((item, index, items) => ({
    ...item,
    offset: items.slice(0, index).reduce((total, segment) => total + segment.percent, 0),
  }));

  return (
    <section
      className={classNames(styles['panel'], styles['whoPanel'])}
      aria-labelledby="who-title"
    >
      <h2 id="who-title">Who’s coming</h2>
      {model.demographics ? (
        <>
          <p>
            Based on {model.demographics.identifiedGuests.toLocaleString('en-IN')} identified guests
          </p>
          <svg
            className={styles['genderBar']}
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            role="img"
            aria-label={model.demographics.gender
              .map((item) => `${item.label}: ${String(item.percent)}%`)
              .join(', ')}
          >
            {genderSegments?.map((item) => (
              <rect
                key={item.label}
                data-group={
                  item.label.toLowerCase().startsWith('other') ? 'other' : item.label.toLowerCase()
                }
                x={item.offset}
                y="0"
                width={item.percent}
                height="10"
              />
            ))}
          </svg>
          <div className={styles['genderLabels']}>
            {model.demographics.gender.map((item) => (
              <div key={item.label}>
                <i
                  data-group={
                    item.label.toLowerCase().startsWith('other')
                      ? 'other'
                      : item.label.toLowerCase()
                  }
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                <strong>{item.percent}%</strong>
              </div>
            ))}
          </div>
          <span className={styles['srOnly']}>{model.demographics.denominatorNote}</span>
        </>
      ) : (
        <DemographicsUnavailable message={model.demographicUnavailableReason} />
      )}
    </section>
  );
}

function DemographicsUnavailable({ message }: { readonly message: string }) {
  return (
    <div className={styles['demographicsUnavailable']}>
      <strong>Demographics unavailable</strong>
      <p>{message}</p>
    </div>
  );
}

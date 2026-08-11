import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { InfoIcon } from '@c1rcle/icons';

import { venueEventsAnalyticsModel } from '../venue-events-analytics-model';
import { EVENTS } from '../venue-events-model';

import styles from './VenueEventsAnalytics.module.css';
import { VenueEventsAnalyticsFilters } from './VenueEventsAnalyticsFilters';

import type { VenueEventsAnalyticsViewModel } from '../venue-events-analytics-model';

const classNames = (...tokens: readonly (string | undefined)[]): string =>
  tokens.filter((token): token is string => Boolean(token)).join(' ');

const chartPath = (values: readonly number[]): string => {
  const width = 650;
  const height = 198;
  const max = 200_000;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

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
        <p>
          Confirmed event, order, and ticket aggregates are required before this report can render.
        </p>
        <Link href="/venue/events">Return to all events</Link>
      </section>
    );
  }

  const venues = Array.from(new Set(EVENTS.map((event) => event.venue))).sort();
  const currentPath = chartPath(model.sales.current);
  const previousPath = chartPath(model.sales.previous);

  return (
    <div className={styles['page']}>
      <header className={styles['pageHeader']}>
        <div>
          <h1>Events Analytics</h1>
        </div>
        <Suspense fallback={<div className={styles['analyticsFiltersFallback']} aria-hidden="true" />}>
          <VenueEventsAnalyticsFilters
            venues={venues}
            events={EVENTS.map((event) => ({ id: event.id, name: event.name }))}
          />
        </Suspense>
      </header>

      <section className={styles['metrics']} aria-label="Events Analytics summary">
        {model.metrics.map((metric) => (
          <article key={metric.label} title={metric.definition}>
            <span>
              {metric.label} <InfoIcon size={12} aria-hidden="true" />
            </span>
            <strong>{metric.value}</strong>
            <small>{metric.comparison}</small>
          </article>
        ))}
      </section>

      <div className={styles['primaryGrid']}>
        <section
          className={classNames(styles['panel'], styles['salesPanel'])}
          aria-labelledby="sales-over-time-title"
        >
          <div className={styles['sectionHeading']}>
            <h2 id="sales-over-time-title">Sales over time</h2>
            <div className={styles['salesMode']} aria-label="Sales chart metric">
              <span>Sales</span>
              <span>Revenue</span>
              <span>Daily</span>
            </div>
          </div>
          <div className={styles['legend']}>
            <span className={styles['currentLegend']}>{model.sales.currentLabel}</span>
            <span className={styles['previousLegend']}>{model.sales.previousLabel}</span>
          </div>
          <div className={styles['chart']}>
            <div className={styles['yLabels']} aria-hidden="true">
              <span>₹2.0L</span>
              <span>₹1.5L</span>
              <span>₹1.0L</span>
              <span>₹50K</span>
              <span>₹0</span>
            </div>
            <svg
              viewBox="0 0 650 198"
              preserveAspectRatio="none"
              role="img"
              aria-label="Daily sales from 10 July through 16 July 2025 compared with the prior seven days"
            >
              <g className={styles['gridLines']} aria-hidden="true">
                <line x1="0" y1="0" x2="650" y2="0" />
                <line x1="0" y1="49.5" x2="650" y2="49.5" />
                <line x1="0" y1="99" x2="650" y2="99" />
                <line x1="0" y1="148.5" x2="650" y2="148.5" />
                <line x1="0" y1="198" x2="650" y2="198" />
              </g>
              <path className={styles['previousLine']} d={previousPath} />
              <path className={styles['currentLine']} d={currentPath} />
              {model.sales.current.map((value, index) => {
                const x = (index / Math.max(model.sales.current.length - 1, 1)) * 650;
                const y = 198 - (value / 200_000) * 198;
                return (
                  <circle key={`${String(index)}-${String(value)}`} cx={x} cy={y} r="4">
                    <title>{`${model.sales.labels[index] ?? ''}: ₹${value.toLocaleString('en-IN')}`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className={styles['xLabels']} aria-hidden="true">
              {model.sales.labels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <table className={styles['srOnly']}>
              <caption>Sales over time values</caption>
              <tbody>
                {model.sales.labels.map((label, index) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{model.sales.current[index]?.toLocaleString('en-IN')}</td>
                    <td>{model.sales.previous[index]?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className={classNames(styles['panel'], styles['demographics'])}
          aria-labelledby="demographics-title"
        >
          <div className={styles['sectionHeading']}>
            <div>
              <h2 id="demographics-title">Guest demographics</h2>
              {model.demographics ? (
                <p>
                  Based on {model.demographics.identifiedGuests.toLocaleString('en-IN')} identified
                  guests · {model.demographics.coveragePercent}% coverage
                </p>
              ) : null}
            </div>
            <InfoIcon size={14} aria-hidden="true" />
          </div>
          {model.demographics ? (
            <DemographicBars demographics={model.demographics} />
          ) : (
            <div className={styles['demographicsUnavailable']}>
              <div>
                <span>Age distribution</span>
                <strong>Unavailable</strong>
              </div>
              <div>
                <span>Gender distribution</span>
                <strong>Unavailable</strong>
              </div>
              <p>{model.demographicUnavailableReason}</p>
            </div>
          )}
        </section>
      </div>

      <div className={styles['secondaryGrid']}>
        <section className={classNames(styles['panel'], styles['tiers'])} aria-labelledby="tier-title">
          <h2 id="tier-title">Ticket tier performance</h2>
          <div className={styles['simpleTable']}>
            <div aria-hidden="true">
              <span>Tier</span>
              <span>Tickets sold</span>
              <span>Revenue</span>
            </div>
            {model.tiers.map((tier) => (
              <article key={tier.name}>
                <strong>{tier.name}</strong>
                <span>{tier.count}</span>
                <span>{tier.money}</span>
              </article>
            ))}
          </div>
        </section>

        <section
          className={classNames(styles['panel'], styles['comparison'])}
          aria-labelledby="comparison-title"
        >
          <h2 id="comparison-title">Event comparison</h2>
          <div className={styles['comparisonTable']}>
            <div aria-hidden="true">
              <span>Event</span>
              <span>Date</span>
              <span>Tickets sold</span>
              <span>Sales</span>
            </div>
            {model.eventComparison.map((event) => (
              <article key={event.id}>
                <span>
                  <Image src={event.artworkSrc} alt="" width={40} height={40} />
                  <strong>{event.name}</strong>
                </span>
                <span>{event.date}</span>
                <span>{event.ticketsSold.toLocaleString('en-IN')}</span>
                <span>{event.sales}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DemographicBars({
  demographics,
}: {
  readonly demographics: NonNullable<VenueEventsAnalyticsViewModel['demographics']>;
}) {
  return (
    <div>
      <h3>Age distribution</h3>
      <div className={styles['ageBars']}>
        {demographics.age.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <progress value={item.percent} max={100} aria-label={`${item.label}: ${String(item.percent)}%`} />
            <strong>{item.percent}%</strong>
          </div>
        ))}
      </div>
      <h3>Gender distribution</h3>
      <div className={styles['genderBars']}>
        {demographics.gender.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <progress value={item.percent} max={100} />
            <strong>{item.percent}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

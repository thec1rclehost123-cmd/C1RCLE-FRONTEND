'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { Icon } from '../Icon';
import { formatAnalyticsCurrency } from '../venue-event-analytics-model';

import styles from './VenueEventAnalytics.module.css';

import type { EventAnalyticsRange, VenueEventAnalyticsModel } from '../venue-event-analytics-model';

export function VenueEventAnalyticsScreen({
  model,
  range = '7d',
  state = 'ready',
}: {
  readonly model: VenueEventAnalyticsModel;
  readonly range?: EventAnalyticsRange;
  readonly state?: 'ready' | 'loading' | 'error';
}) {
  const auth = useDashboardAuth();
  const [rangeOpen, setRangeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const canView =
    auth.grantedPermissions.length === 0 ||
    auth.grantedPermissions.includes('*') ||
    auth.hasPermission('VIEW_ANALYTICS');
  if (!canView)
    return (
      <AnalyticsState
        icon="lock"
        title="You don’t have permission"
        detail="Contact your administrator for access."
      />
    );
  if (state === 'loading') return <AnalyticsLoading />;
  if (state === 'error')
    return (
      <AnalyticsState
        icon="triangle-alert"
        title="We couldn’t load these analytics."
        detail="Check your connection and try again."
        action="Retry"
      />
    );
  return (
    <section className={styles['page']}>
      <header className={styles['header']}>
        <div className={styles['identity']}>
          <Link href={`/venue/events/${model.event.id}`}>← Back to event</Link>
          <span>
            <Image src={model.event.posterSrc} alt="" width={128} height={64} />
            <span>
              <h1>{model.event.name}</h1>
              <p>
                {model.event.date} · {model.event.venue}
              </p>
            </span>
          </span>
        </div>
        <div className={styles['headerActions']}>
          <div>
            <button
              type="button"
              aria-expanded={rangeOpen}
              onClick={() => {
                setRangeOpen(!rangeOpen);
                setExportOpen(false);
              }}
            >
              <Icon name="calendar" size={17} />
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}⌄
            </button>
            {rangeOpen ? (
              <nav aria-label="Date range">
                {(['7d', '30d', '90d'] as const).map((item) => (
                  <Link key={item} href={`/venue/events/${model.event.id}/analytics?range=${item}`}>
                    {item === '7d'
                      ? 'Last 7 days'
                      : item === '30d'
                        ? 'Last 30 days'
                        : 'Last 90 days'}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
          <div>
            <button
              type="button"
              aria-expanded={exportOpen}
              onClick={() => {
                setExportOpen(!exportOpen);
                setRangeOpen(false);
              }}
            >
              <Icon name="download" size={17} />
              Export report⌄
            </button>
            {exportOpen ? (
              <div className={styles['exportMenu']}>
                <button type="button" disabled title="Analytics export adapter unavailable">
                  Export as CSV
                </button>
                <button type="button" disabled title="PDF export is not supported">
                  Export as PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <section className={styles['metrics']} aria-label="Event analytics summary">
        <article>
          <small>Tickets sold</small>
          <strong>{model.metrics.ticketsSold}</strong>
        </article>
        <article>
          <small>Gross sales</small>
          <strong>{formatAnalyticsCurrency(model.metrics.grossSalesPaise)}</strong>
        </article>
        <article>
          <small>Guests checked in</small>
          <strong>{model.metrics.guestsCheckedIn}</strong>
        </article>
      </section>
      <div className={styles['analyticsGrid']}>
        <article className={styles['salesCard']}>
          <h2>Sales over time</h2>
          <div className={styles['legend']}>
            <span>This period</span>
            <span>Previous period</span>
          </div>
          <SalesChart model={model} activePoint={activePoint} setActivePoint={setActivePoint} />
          <details>
            <summary>View as data table</summary>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>This period</th>
                  <th>Previous period</th>
                </tr>
              </thead>
              <tbody>
                {model.sales.map((point, index) => (
                  <tr key={point.label}>
                    <th>{point.label}</th>
                    <td>{formatAnalyticsCurrency(point.valueRupees * 100)}</td>
                    <td>
                      {formatAnalyticsCurrency(
                        (model.previousSales[index]?.valueRupees ?? 0) * 100,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </article>
        <aside className={styles['demographics']}>
          <AgeCard demographics={model.demographics} />
          <GenderCard demographics={model.demographics} />
        </aside>
      </div>
      <section className={styles['tickets']}>
        <h2>Ticket types</h2>
        {model.ticketTypes.map((tier) => (
          <div key={tier.name}>
            <span>{tier.name}</span>
            <progress
              max={100}
              value={tier.percent}
              aria-label={`${tier.name} ${String(tier.percent)} percent sold`}
            />
            <strong>
              {tier.sold} / {tier.capacity}
            </strong>
            <em>{tier.percent}%</em>
          </div>
        ))}
      </section>
      <p className={styles['consent']}>
        Guest demographics appear only when consented aggregate data is available.
      </p>
    </section>
  );
}

function SalesChart({
  model,
  activePoint,
  setActivePoint,
}: {
  readonly model: VenueEventAnalyticsModel;
  readonly activePoint: number | null;
  readonly setActivePoint: (value: number | null) => void;
}) {
  const max = Math.max(...model.sales.map((point) => point.valueRupees), 1);
  const points = useMemo(
    () =>
      model.sales.map((point, index) => ({
        x: 40 + index * (560 / Math.max(1, model.sales.length - 1)),
        y: 190 - (point.valueRupees / max) * 150,
        label: point.label,
        value: point.valueRupees,
      })),
    [max, model.sales],
  );
  const previous = useMemo(
    () =>
      model.previousSales
        .map(
          (point, index) =>
            `${String(40 + index * (560 / Math.max(1, model.previousSales.length - 1)))},${String(190 - (point.valueRupees / max) * 150)}`,
        )
        .join(' '),
    [max, model.previousSales],
  );
  return (
    <div className={styles['chart']}>
      <svg viewBox="0 0 640 230" role="img" aria-label="Sales over time line chart">
        <g className={styles['grid']}>
          {[40, 90, 140, 190].map((y) => (
            <line key={y} x1="40" x2="600" y1={y} y2={y} />
          ))}
        </g>
        <polyline className={styles['previousLine']} points={previous} />
        <polyline
          className={styles['currentLine']}
          points={points.map((point) => `${String(point.x)},${String(point.y)}`).join(' ')}
        />
        {points.map((point, index) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              tabIndex={0}
              aria-label={`${point.label}: ${formatAnalyticsCurrency(point.value * 100)}`}
              onFocus={() => {
                setActivePoint(index);
              }}
              onBlur={() => {
                setActivePoint(null);
              }}
              onMouseEnter={() => {
                setActivePoint(index);
              }}
              onMouseLeave={() => {
                setActivePoint(null);
              }}
            />
            {activePoint === index ? (
              <g className={styles['tooltip']}>
                <rect
                  x={Math.min(500, Math.max(10, point.x - 55))}
                  y={Math.max(2, point.y - 58)}
                  width="120"
                  height="48"
                  rx="6"
                />
                <text x={Math.min(510, Math.max(20, point.x - 45))} y={Math.max(20, point.y - 39)}>
                  {point.label}
                </text>
                <text x={Math.min(510, Math.max(20, point.x - 45))} y={Math.max(36, point.y - 23)}>
                  {formatAnalyticsCurrency(point.value * 100)}
                </text>
              </g>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}

function AgeCard({
  demographics,
}: {
  readonly demographics: VenueEventAnalyticsModel['demographics'];
}) {
  if (!demographics) return <UnavailableDemographics />;
  return (
    <article className={styles['demoCard']}>
      <h2>Guest age</h2>
      {demographics.age.map((item) => (
        <div className={styles['ageRow']} key={item.label}>
          <span>{item.label}</span>
          <progress
            max={100}
            value={item.value}
            aria-label={`${item.label} ${String(item.value)} percent`}
          />
          <strong>{item.value}%</strong>
        </div>
      ))}
    </article>
  );
}
function GenderCard({
  demographics,
}: {
  readonly demographics: VenueEventAnalyticsModel['demographics'];
}) {
  if (!demographics) return null;
  const toneClasses = [styles['women'], styles['men'], styles['other']] as const;
  return (
    <article className={styles['demoCard']}>
      <h2>Gender</h2>
      <div className={styles['gender']}>
        <i className={styles['genderDonut']} />
        <ul>
          {demographics.gender.map((item, index) => (
            <li key={item.label}>
              <span className={toneClasses[index] ?? styles['other']} />
              {item.label}
              <b>{item.value}%</b>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
function UnavailableDemographics() {
  return (
    <article className={[styles['demoCard'], styles['demoUnavailable']].filter(Boolean).join(' ')}>
      <Icon name="users" size={38} />
      <h2>Demographics unavailable</h2>
      <p>Consented aggregate demographic data is unavailable.</p>
    </article>
  );
}
function AnalyticsLoading() {
  return (
    <section className={styles['loading']} role="status" aria-label="Loading analytics">
      <span />
      <span />
      <span />
      <div />
    </section>
  );
}
function AnalyticsState({
  icon,
  title,
  detail,
  action,
}: {
  readonly icon: string;
  readonly title: string;
  readonly detail: string;
  readonly action?: string;
}) {
  return (
    <section className={styles['state']} role="alert">
      <Icon name={icon} size={44} />
      <h1>{title}</h1>
      <p>{detail}</p>
      {action ? (
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
        >
          {action}
        </button>
      ) : (
        <Link href="/venue/overview">Go to overview</Link>
      )}
    </section>
  );
}

'use client';

import { useState } from 'react';

import { EventDetailLayout } from '../venue/event-detail/EventDetailLayout';
import { formatInr } from '@/lib/partner/contracts';

import styles from '../venue/event-detail/VenueEventDetail.module.css';

import type { PromoterEvent } from '@/lib/partner/contracts';

const s = (name: string) => styles[name] ?? name;

const DISCOVERY_CARD_POSTERS: Record<string, string> = {
  bassline: '/venue/events/warehouse-rave.webp',
  sunset: '/venue/events/sunset-sessions.webp',
  monsoon: '/venue/events/monsoon-sessions.webp',
  bollywood: '/venue/events/bollywood-brunch.webp',
  neon: '/venue/neon-nights-poster.webp',
};

function resolvePoster(id: string): string {
  for (const [key, src] of Object.entries(DISCOVERY_CARD_POSTERS)) {
    if (id.includes(key)) return src;
  }
  return '/venue/neon-nights-poster.webp';
}

const eventTabs = (id: string, _activeTab: string) => [
  { label: 'Summary', href: `/promoter/events/${id}?tab=summary` },
  { label: 'Performance', href: `/promoter/events/${id}?tab=performance` },
  { label: 'Orders', href: `/promoter/events/${id}?tab=orders` },
  { label: 'Links', href: `/promoter/events/${id}?tab=links` },
  { label: 'Commission', href: `/promoter/events/${id}?tab=commission` },
];

export function PromoterEventDetailScreen({
  event,
  activeTab = 'summary',
}: {
  readonly event: PromoterEvent;
  readonly activeTab?: string;
}) {
  const [copied, setCopied] = useState(false);
  const posterSrc = resolvePoster(event.id);

  const headerModel = {
    id: event.id,
    name: event.name,
    venue: `${event.venue} · ${event.city}`,
    dateTimeLabel: `${event.date} · ${event.time}`,
    posterSrc,
    posterAlt: event.name,
    statusLabel: event.status === 'active' ? 'Active' : event.status === 'invited' ? 'Invited' : 'Open opportunity',
    statusTone: (event.status === 'active' ? 'success' : 'warning') as 'success' | 'warning' | 'neutral',
    roleLabel: `Terms: ${event.commissionLabel}`,
  };

  const copyLink = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const actions = (
    <button type="button" className="pd-button pd-button--primary" onClick={copyLink}>
      {copied ? 'Copied link!' : 'Get campaign link'}
    </button>
  );

  const chartPath = "M 0 160 L 50 145 L 100 130 L 150 100 L 200 110 L 250 85 L 300 70 L 350 90 L 400 55 L 450 40 L 500 25 L 600 15";

  return (
    <EventDetailLayout event={headerModel} tabs={eventTabs(event.id, activeTab)} actions={actions}>
      {activeTab === 'performance' ? (
        <div className={s('summaryPage')}>
          <div className={s('metricStrip')}>
            <article>
              <span>Tracked clicks</span>
              <strong>{event.clicks.toLocaleString('en-IN')}</strong>
            </article>
            <article>
              <span>Tickets moved</span>
              <strong>{event.tickets}</strong>
            </article>
            <article>
              <span>Conversion</span>
              <strong>{event.conversion}%</strong>
            </article>
          </div>

          <section className={s('panel')}>
            <div className={s('panelHeading')}>
              <h2>Attribution trend</h2>
            </div>
            <p style={{ color: 'var(--dashboard-text-secondary)', fontSize: '13px', margin: '4px 0 16px' }}>
              Daily tickets attributed to this event's promoter links.
            </p>
            <div className={s('chart')}>
              <div className={s('yLabels')} aria-hidden="true">
                <span>20</span>
                <span>15</span>
                <span>10</span>
                <span>5</span>
                <span>0</span>
              </div>
              <svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Attribution trend chart">
                <g className={s('gridLines')}>
                  <line x1="0" y1="0" x2="600" y2="0" />
                  <line x1="0" y1="45" x2="600" y2="45" />
                  <line x1="0" y1="90" x2="600" y2="90" />
                  <line x1="0" y1="135" x2="600" y2="135" />
                  <line x1="0" y1="180" x2="600" y2="180" />
                </g>
                <path className={s('chartLine')} d={chartPath} />
              </svg>
              <div className={s('xLabels')} aria-hidden="true">
                <span>Day 1</span>
                <span>Day 3</span>
                <span>Day 5</span>
                <span>Day 7</span>
                <span>Day 9</span>
                <span>Day 11</span>
                <span>Day 13</span>
              </div>
            </div>
          </section>
        </div>
      ) : activeTab === 'orders' ? (
        <div className={s('guestsPage')}>
          <section className={s('guestTable')} aria-label="Attributed orders">
            <table>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Channel</th>
                  <th scope="col">Tickets</th>
                  <th scope="col">Attributed earnings</th>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>#ORD-2026-881</strong></td>
                  <td>Instagram Bio</td>
                  <td>2 tickets</td>
                  <td><strong>{formatInr(36000)}</strong></td>
                  <td><span className={s('orderStatus')}>Confirmed</span></td>
                  <td style={{ textAlign: 'right' }}>12m ago</td>
                </tr>
                <tr>
                  <td><strong>#ORD-2026-874</strong></td>
                  <td>WhatsApp Broadcast</td>
                  <td>1 ticket</td>
                  <td><strong>{formatInr(18000)}</strong></td>
                  <td><span className={s('orderStatus')}>Confirmed</span></td>
                  <td style={{ textAlign: 'right' }}>45m ago</td>
                </tr>
                <tr>
                  <td><strong>#ORD-2026-862</strong></td>
                  <td>Instagram Story</td>
                  <td>4 tickets</td>
                  <td><strong>{formatInr(72000)}</strong></td>
                  <td><span className={s('orderStatus')}>Confirmed</span></td>
                  <td style={{ textAlign: 'right' }}>2h ago</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      ) : activeTab === 'links' ? (
        <div className={s('salesGrid')}>
          <section className={s('panel')}>
            <div className={s('panelHeading')}>
              <h2>Tracked campaign link</h2>
            </div>
            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--dashboard-surface)', borderRadius: '12px', border: '1px solid var(--dashboard-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--dashboard-text-secondary)' }}>Permanent promoter URL</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <strong style={{ fontSize: '15px' }}>c1rcle.com/e/{event.id}?ref=promoter</strong>
                <button type="button" onClick={copyLink} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--dashboard-accent)', background: 'var(--dashboard-accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            </div>
          </section>
          <section className={s('panel')}>
            <h2>Channel breakdown</h2>
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--dashboard-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--dashboard-text-secondary)' }}>Instagram Bio</span>
                <strong>682 clicks · 32 tickets</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--dashboard-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--dashboard-text-secondary)' }}>WhatsApp Broadcast</span>
                <strong>410 clicks · 18 tickets</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--dashboard-text-secondary)' }}>Direct / Other</span>
                <strong>148 clicks · 6 tickets</strong>
              </div>
            </div>
          </section>
        </div>
      ) : activeTab === 'commission' ? (
        <div className={s('summaryPage')}>
          <div className={s('metricStrip')}>
            <article>
              <span>Commission model</span>
              <strong>{event.commissionLabel}</strong>
            </article>
            <article>
              <span>Total tickets moved</span>
              <strong>{event.tickets}</strong>
            </article>
            <article>
              <span>Current earnings</span>
              <strong>{formatInr(event.earningsPaise)}</strong>
            </article>
          </div>
          <section className={s('panel')}>
            <h2>Commission terms & agreement</h2>
            <p style={{ color: 'var(--dashboard-text-secondary)', margin: '8px 0 16px', fontSize: '14px' }}>
              Attribution window: 14 days from initial click. Earnings are settled to your payout account 48 hours after event completion.
            </p>
          </section>
        </div>
      ) : (
        /* Default Summary view */
        <div className={s('summaryPage')}>
          <div className={s('metricStrip')}>
            <article>
              <span>Tickets attributed</span>
              <strong>{event.tickets}</strong>
            </article>
            <article>
              <span>Conversion</span>
              <strong>{event.conversion}%</strong>
            </article>
            <article>
              <span>Your earnings</span>
              <strong>{formatInr(event.earningsPaise)}</strong>
            </article>
          </div>

          <div className={s('summaryGrid')}>
            <section className={s('panel')}>
              <div className={s('panelHeading')}>
                <h2>Ticket momentum</h2>
              </div>
              <div className={s('chart')}>
                <div className={s('yLabels')} aria-hidden="true">
                  <span>20</span>
                  <span>15</span>
                  <span>10</span>
                  <span>5</span>
                  <span>0</span>
                </div>
                <svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Ticket momentum chart">
                  <g className={s('gridLines')}>
                    <line x1="0" y1="0" x2="600" y2="0" />
                    <line x1="0" y1="45" x2="600" y2="45" />
                    <line x1="0" y1="90" x2="600" y2="90" />
                    <line x1="0" y1="135" x2="600" y2="135" />
                    <line x1="0" y1="180" x2="600" y2="180" />
                  </g>
                  <path className={s('chartLine')} d={chartPath} />
                </svg>
                <div className={s('xLabels')} aria-hidden="true">
                  <span>Day 1</span>
                  <span>Day 3</span>
                  <span>Day 5</span>
                  <span>Day 7</span>
                  <span>Day 9</span>
                  <span>Day 11</span>
                  <span>Day 13</span>
                </div>
              </div>
            </section>

            <div style={{ display: 'grid', gap: '16px' }}>
              <section className={s('panel')}>
                <h2>Promoter terms</h2>
                <div style={{ display: 'grid', gap: '12px', marginTop: '16px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dashboard-text-secondary)' }}>Commission rate</span>
                    <strong>{event.commissionLabel}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dashboard-text-secondary)' }}>Venue</span>
                    <strong>{event.venue}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dashboard-text-secondary)' }}>Host</span>
                    <strong>{event.host}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dashboard-text-secondary)' }}>Status</span>
                    <strong style={{ color: '#10b981' }}>{event.status === 'active' ? 'Active' : 'Invited'}</strong>
                  </div>
                </div>
              </section>

              <section className={s('panel')}>
                <h2>Recent orders</h2>
                <div className={s('summaryOrders')}>
                  <article>
                    <span aria-hidden="true">🎟</span>
                    <strong>2x Ticket sale</strong>
                    <span>Instagram</span>
                    <b>{formatInr(36000)}</b>
                    <time>12m ago</time>
                  </article>
                  <article>
                    <span aria-hidden="true">🎟</span>
                    <strong>1x Ticket sale</strong>
                    <span>WhatsApp</span>
                    <b>{formatInr(18000)}</b>
                    <time>45m ago</time>
                  </article>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </EventDetailLayout>
  );
}

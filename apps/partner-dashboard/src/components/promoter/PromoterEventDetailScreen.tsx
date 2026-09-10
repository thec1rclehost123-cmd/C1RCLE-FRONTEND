'use client';

import Link from 'next/link';

import { formatInr } from '@/lib/partner/contracts';

import { EventDetailLayout } from '../venue/event-detail/EventDetailLayout';
import styles from '../venue/event-detail/VenueEventDetail.module.css';

import {
  getPrimaryPromoterEventLink,
  getPromoterEventLinks,
  getPromoterEventOrders,
  getPromoterEventStatusLabel,
} from './promoter-event-detail-model';
import { CopyLinkButton } from './PromoterShareActions';


import type { PromoterEvent, PromoterOrder, PromoterTrackingLink } from '@/lib/partner/contracts';

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

const eventTabs = (id: string) => [
  { id: 'summary', label: 'Summary', href: `/promoter/events/${id}?tab=summary` },
  { id: 'performance', label: 'Performance', href: `/promoter/events/${id}?tab=performance` },
  { id: 'orders', label: 'Orders', href: `/promoter/events/${id}?tab=orders` },
  { id: 'links', label: 'Links', href: `/promoter/events/${id}?tab=links` },
  { id: 'commission', label: 'Commission', href: `/promoter/events/${id}?tab=commission` },
];

export function PromoterEventDetailScreen({
  event,
  orders,
  links,
  activeTab = 'summary',
}: {
  readonly event: PromoterEvent;
  readonly orders: readonly PromoterOrder[];
  readonly links: readonly PromoterTrackingLink[];
  readonly activeTab?: string;
}) {
  const posterSrc = resolvePoster(event.id);
  const eventLinks = getPromoterEventLinks(event.id, links);
  const primaryLink = getPrimaryPromoterEventLink(event.id, links);
  const eventOrders = getPromoterEventOrders(event, orders);

  const headerModel = {
    id: event.id,
    name: event.name,
    venue: `${event.venue} · ${event.city}`,
    dateTimeLabel: `${event.date} · ${event.time}`,
    posterSrc,
    posterAlt: event.name,
    statusLabel: getPromoterEventStatusLabel(event.status),
    statusTone: (event.status === 'active' ? 'success' : 'warning') as
      'success' | 'warning' | 'neutral',
    roleLabel: `Terms: ${event.commissionLabel}`,
  };

  const actions = primaryLink ? (
    <CopyLinkButton value={`https://${primaryLink.shortUrl}`} label="Copy link" />
  ) : (
    <Link className="pd-button pd-button--primary" href={`/promoter/links?event=${event.id}`}>
      Get link
    </Link>
  );

  return (
    <EventDetailLayout
      event={headerModel}
      tabs={eventTabs(event.id)}
      activeTab={activeTab}
      actions={actions}
    >
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
            <p className={s('emptyState')}>
              Daily attribution history is unavailable for this event.
            </p>
          </section>
        </div>
      ) : activeTab === 'orders' ? (
        <div className={s('guestsPage')}>
          <section className={s('guestTable')} aria-label="Attributed orders">
            <table>
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Channel</th>
                  <th scope="col">Tickets</th>
                  <th scope="col">Attributed earnings</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {eventOrders.length ? (
                  eventOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.id}</strong>
                      </td>
                      <td>{order.channel}</td>
                      <td>
                        {order.ticketCount} {order.ticketCount === 1 ? 'ticket' : 'tickets'}
                      </td>
                      <td>
                        <strong>{formatInr(order.commissionPaise)}</strong>
                      </td>
                      <td>
                        <span className={s('orderStatus')}>{order.status}</span>
                      </td>
                      <td className="text-right">{order.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <span className={s('emptyState')}>
                        Order data unavailable for this event.
                      </span>
                    </td>
                  </tr>
                )}
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
            {primaryLink ? (
              <div className={s('summaryOrders')}>
                <article>
                  <strong>{primaryLink.shortUrl}</strong>
                  <span>Permanent tracked link</span>
                  <CopyLinkButton value={`https://${primaryLink.shortUrl}`} label="Copy link" />
                </article>
              </div>
            ) : (
              <p className={s('emptyState')}>
                Permanent tracked link unavailable.{' '}
                <Link href={`/promoter/links?event=${event.id}`}>Open Links</Link>
              </p>
            )}
          </section>
          <section className={s('panel')}>
            <h2>Channel breakdown</h2>
            {eventLinks.length ? (
              <div className={s('summaryOrders')}>
                {eventLinks.map((link) => (
                  <article key={link.id}>
                    <span>
                      {link.channel} · {link.label}
                    </span>
                    <strong>
                      {link.clicks.toLocaleString('en-IN')} clicks · {link.purchases} tickets
                    </strong>
                  </article>
                ))}
              </div>
            ) : (
              <p className={s('emptyState')}>Channel attribution is unavailable for this event.</p>
            )}
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
            <p className={s('emptyState')}>
              Additional settlement terms are unavailable for this event.
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
              <p className={s('emptyState')}>Daily ticket history is unavailable for this event.</p>
            </section>

            <div className="grid gap-4">
              <section className={s('panel')}>
                <h2>Promoter terms</h2>
                <div className={s('summaryOrders')}>
                  <article>
                    <span>Commission rate</span>
                    <strong>{event.commissionLabel}</strong>
                  </article>
                  <article>
                    <span>Venue</span>
                    <strong>{event.venue}</strong>
                  </article>
                  <article>
                    <span>Host</span>
                    <strong>{event.host}</strong>
                  </article>
                  <article>
                    <span>Status</span>
                    <strong>{getPromoterEventStatusLabel(event.status)}</strong>
                  </article>
                </div>
              </section>

              <section className={s('panel')}>
                <h2>Recent orders</h2>
                {eventOrders.length ? (
                  <div className={s('summaryOrders')}>
                    {eventOrders.slice(0, 3).map((order) => (
                      <article key={order.id}>
                        <strong>{order.ticketCount}x Ticket sale</strong>
                        <span>{order.channel}</span>
                        <b>{formatInr(order.commissionPaise)}</b>
                        <time>{order.createdAt}</time>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={s('emptyState')}>Order data unavailable for this event.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </EventDetailLayout>
  );
}

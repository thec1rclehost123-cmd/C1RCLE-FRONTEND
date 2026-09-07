import Link from 'next/link';

import { NextIcon, TicketIcon } from '@c1rcle/icons';

import { EventInformationAccordion } from '../event-detail/EventInformationAccordion';
import { EventLineChart } from '../event-detail/EventLineChart';

import styles from '../event-detail/VenueEventDetail.module.css';

import type { VenueEventSummaryModel } from '../event-detail-model';

export function VenueEventSummaryScreen({
  eventId,
  model,
}: {
  readonly eventId: string;
  readonly model: VenueEventSummaryModel | null;
}) {
  if (!model) {
    return (
      <section className={styles['emptyState']}>
        <span>Summary unavailable</span>
        <h2>Sales and order data are not available for this event.</h2>
        <p>The event header and task navigation remain available.</p>
        <Link href="/venue/events">Return to events</Link>
      </section>
    );
  }

  return (
    <div className={styles['summaryPage']}>
      <section className={styles['metricStrip']} aria-label="Event summary">
        <article>
          <span>Tickets sold</span>
          <strong>{model.metrics.ticketsSold}</strong>
        </article>
        <article>
          <span>Gross sales</span>
          <strong>{model.metrics.grossSales}</strong>
        </article>
        <article>
          <span>Guests checked in</span>
          <strong>{model.metrics.guestsCheckedIn}</strong>
        </article>
      </section>

      <div className={styles['summaryGrid']}>
        <section className={styles['panel']} aria-labelledby="sales-progress-title">
          <header className={styles['panelHeading']}>
            <h2 id="sales-progress-title">Sales progress</h2>
            <Link href={`/venue/events/${eventId}/sales`}>
              View sales <NextIcon size={17} aria-hidden="true" />
            </Link>
          </header>
          <EventLineChart
            values={model.salesProgress.valuesRupees}
            labels={model.salesProgress.labels}
            yLabels={['₹6L', '₹4L', '₹2L', '₹0']}
            maximum={600_000}
            accessibleSummary={model.salesProgress.accessibleSummary}
            valueLabel={(value) => `₹${value.toLocaleString('en-IN')}`}
          />
        </section>

        <section className={styles['panel']} aria-labelledby="recent-orders-title">
          <header className={styles['panelHeading']}>
            <h2 id="recent-orders-title">Recent orders</h2>
            <Link href={`/venue/events/${eventId}/sales#recent-orders`}>
              View all <NextIcon size={17} aria-hidden="true" />
            </Link>
          </header>
          <div className={styles['summaryOrders']}>
            {model.recentOrders.map((order) => (
              <article key={order.id}>
                <TicketIcon size={19} aria-hidden="true" />
                <strong>{order.ticket}</strong>
                <span>{order.ticketLabel}</span>
                <b>{order.amount}</b>
                <time>{order.relativeTime}</time>
              </article>
            ))}
          </div>
        </section>

        <section className={styles['panel']} aria-labelledby="summary-ticket-types-title">
          <h2 id="summary-ticket-types-title">Ticket types</h2>
          <div className={styles['summaryTicketTypes']}>
            {model.ticketTypes.map((ticketType) => (
              <article key={ticketType.name}>
                <strong>{ticketType.name}</strong>
                <span>
                  {ticketType.sold.toLocaleString('en-IN')} /{' '}
                  {ticketType.capacity.toLocaleString('en-IN')}
                </span>
                <progress
                  value={ticketType.sold}
                  max={ticketType.capacity}
                  aria-label={`${ticketType.name}: ${String(ticketType.sold)} of ${String(ticketType.capacity)} sold`}
                />
                <b>{ticketType.soldPercent}%</b>
              </article>
            ))}
          </div>
        </section>

        <EventInformationAccordion information={model.information} />
      </div>
    </div>
  );
}

import Link from 'next/link';

import { EventOrdersTable } from '../event-detail/EventOrdersTable';
import { EventSalesChart } from '../event-detail/EventSalesChart';

import styles from '../event-detail/VenueEventDetail.module.css';

import type { VenueEventSalesModel } from '../event-detail-model';

export function VenueEventSalesScreen({ model }: { readonly model: VenueEventSalesModel | null }) {
  if (!model) {
    return (
      <section className={styles['emptyState']}>
        <span>Sales unavailable</span>
        <h2>Paid order data is not available for this event.</h2>
        <p>The event header and tabs remain available.</p>
        <Link href="/venue/events">Return to events</Link>
      </section>
    );
  }

  return (
    <div className={styles['salesPage']}>
      <section className={styles['metricStrip']} aria-label="Event sales summary">
        {model.metrics.map((metric) => (
          <article key={metric.label} title={metric.definition}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <div className={styles['salesGrid']}>
        <EventSalesChart chart={model.chart} />
        <section
          className={[styles['panel'], styles['salesTicketTypes']].filter(Boolean).join(' ')}
          aria-labelledby="sales-ticket-types-title"
        >
          <h2 id="sales-ticket-types-title">Ticket types</h2>
          <div>
            {model.ticketTypes.map((ticketType) => (
              <article key={ticketType.name}>
                <div>
                  <strong>{ticketType.name}</strong>
                  <span>{ticketType.price}</span>
                </div>
                <div>
                  <b>{ticketType.sold.toLocaleString('en-IN')} sold</b>
                  <progress
                    value={ticketType.sold}
                    max={ticketType.capacity}
                    aria-label={`${ticketType.name}: ${String(ticketType.sold)} tickets sold`}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <EventOrdersTable orders={model.orders} />
    </div>
  );
}

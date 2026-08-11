'use client';

import { useState } from 'react';

import { EventLineChart } from './EventLineChart';
import styles from './VenueEventDetail.module.css';

import type { VenueEventSalesModel } from '../event-detail-model';

export function EventSalesChart({ chart }: { readonly chart: VenueEventSalesModel['chart'] }) {
  const [mode, setMode] = useState<'sales' | 'tickets'>('sales');
  const isSales = mode === 'sales';

  return (
    <section
      className={[styles['panel'], styles['salesChartPanel']].filter(Boolean).join(' ')}
      aria-labelledby="event-sales-title"
    >
      <header className={styles['panelHeading']}>
        <h2 id="event-sales-title">Sales</h2>
        <div className={styles['chartToggle']} aria-label="Sales chart measure">
          <button
            type="button"
            aria-pressed={isSales}
            onClick={() => {
              setMode('sales');
            }}
          >
            Sales
          </button>
          <button
            type="button"
            aria-pressed={!isSales}
            onClick={() => {
              setMode('tickets');
            }}
          >
            Tickets
          </button>
        </div>
      </header>
      <EventLineChart
        values={isSales ? chart.salesRupees : chart.tickets}
        labels={chart.labels}
        yLabels={isSales ? ['₹1.2L', '₹80K', '₹40K', '₹0'] : ['120', '80', '40', '0']}
        maximum={isSales ? 120_000 : 120}
        accessibleSummary={isSales ? chart.salesSummary : chart.ticketsSummary}
        valueLabel={
          isSales
            ? (value) => `₹${value.toLocaleString('en-IN')}`
            : (value) => `${value.toLocaleString('en-IN')} tickets`
        }
      />
    </section>
  );
}

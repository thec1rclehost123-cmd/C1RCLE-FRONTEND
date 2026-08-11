'use client';

import { useMemo, useState } from 'react';

import { ExportIcon, SearchIcon } from '@c1rcle/icons';

import styles from './VenueEventDetail.module.css';

import type { VenueEventSalesModel } from '../event-detail-model';

const csvCell = (value: string | number): string => JSON.stringify(String(value));

export function EventOrdersTable({ orders }: { readonly orders: VenueEventSalesModel['orders'] }) {
  const [query, setQuery] = useState('');
  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orders;
    return orders.filter((order) =>
      [order.guest, order.ticket, order.status].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [orders, query]);

  const exportOrders = () => {
    const csv = [
      'Guest,Ticket,Quantity,Amount,Status',
      ...visibleOrders.map((order) =>
        [order.guest, order.ticket, order.quantity, order.amount, order.status]
          .map(csvCell)
          .join(','),
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'event-orders.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="recent-orders"
      className={[styles['panel'], styles['ordersPanel']].filter(Boolean).join(' ')}
      aria-labelledby="orders-title"
    >
      <header className={styles['ordersHeading']}>
        <h2 id="orders-title">Recent orders</h2>
        <div>
          <label>
            <SearchIcon size={18} aria-hidden="true" />
            <span className={styles['srOnly']}>Search orders</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search orders..."
            />
          </label>
          <button type="button" onClick={exportOrders}>
            <ExportIcon size={18} aria-hidden="true" />
            Export
          </button>
        </div>
      </header>

      {visibleOrders.length === 0 ? (
        <div className={styles['inlineEmpty']}>
          <strong>No matching orders</strong>
          <span>Try a guest, ticket, or status.</span>
        </div>
      ) : (
        <div className={styles['ordersTable']}>
          <table>
            <thead>
              <tr>
                <th scope="col">Guest</th>
                <th scope="col">Ticket</th>
                <th scope="col">Quantity</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Guest">{order.guest}</td>
                  <td data-label="Ticket">{order.ticket}</td>
                  <td data-label="Quantity">{order.quantity}</td>
                  <td data-label="Amount">{order.amount}</td>
                  <td data-label="Status">
                    <span
                      className={styles['orderStatus']}
                      data-status={order.status.toLowerCase()}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

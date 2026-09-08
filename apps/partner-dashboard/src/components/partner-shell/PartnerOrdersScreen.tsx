'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { BackIcon, OrderIcon, RowActionsIcon, SearchIcon } from '@c1rcle/icons';

import styles from '../venue/screens/VenueOrders.module.css';

export interface PartnerOrdersRow {
  readonly id: string;
  readonly event: string;
  readonly createdAt: string;
  readonly ticketCount: number;
  readonly status: string;
  readonly source?: string;
  readonly total?: string;
  readonly attributedEarnings?: string;
}

export function PartnerOrdersScreen({
  backHref,
  backLabel = 'Finance',
  subtitle,
  scopeLabel,
  rows,
  kind,
}: {
  readonly backHref: string;
  readonly backLabel?: string;
  readonly subtitle: string;
  readonly scopeLabel: string;
  readonly rows: readonly PartnerOrdersRow[];
  readonly kind: 'host' | 'promoter';
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');

  const statusOptions = useMemo(
    () => ['All statuses', ...Array.from(new Set(rows.map((row) => row.status)))],
    [rows],
  );
  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    return rows.filter((row) => {
      const matchesStatus = status === 'All statuses' || row.status === status;
      const matchesQuery =
        normalized.length === 0 ||
        [row.id, row.event, row.createdAt, row.source ?? ''].some((value) =>
          value.toLocaleLowerCase('en-IN').includes(normalized),
        );
      return matchesStatus && matchesQuery;
    });
  }, [query, rows, status]);

  return (
    <section className={styles['page']}>
      <header className={styles['pageHeader']}>
        <div>
          <Link href={backHref} aria-label={`Back to ${backLabel}`}>
            <BackIcon size={18} aria-hidden="true" /> {backLabel}
          </Link>
          <h1>Orders</h1>
          <p>{subtitle}</p>
        </div>
        <div className={styles['orderCount']}>
          <OrderIcon size={19} aria-hidden="true" />
          <span>{scopeLabel}</span>
          <strong>{rows.length}</strong>
        </div>
      </header>

      <section className={styles['ordersPanel']} aria-labelledby="partner-orders-title">
        <header className={styles['panelHeader']}>
          <div>
            <h2 id="partner-orders-title">Orders</h2>
            <span>{visibleRows.length} shown</span>
          </div>
          <div className={styles['filters']}>
            <label className={styles['search']}>
              <span className={styles['srOnly']}>Search orders</span>
              <SearchIcon size={19} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or order #"
              />
            </label>
            <label className={styles['statusFilter']}>
              <span className={styles['srOnly']}>Filter by status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {visibleRows.length === 0 ? (
          <div className={styles['emptyState']}>
            <OrderIcon size={24} aria-hidden="true" />
            <strong>No matching orders</strong>
            <span>Try another order number, event, source, or status.</span>
          </div>
        ) : (
          <div className={styles['tableWrap']}>
            <table data-order-kind={kind}>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Event</th>
                  {kind === 'promoter' ? <th scope="col">Source</th> : null}
                  <th scope="col">Tickets</th>
                  <th scope="col">{kind === 'promoter' ? 'Attributed earnings' : 'Total'}</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className={styles['srOnly']}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Order">
                      <span className={styles['orderIdentity']}>
                        <strong>Order #{row.id}</strong>
                        <small>{row.createdAt}</small>
                      </span>
                    </td>
                    <td data-label="Event">{row.event}</td>
                    {kind === 'promoter' ? <td data-label="Source">{row.source ?? '—'}</td> : null}
                    <td data-label="Tickets">{row.ticketCount}</td>
                    <td data-label={kind === 'promoter' ? 'Attributed earnings' : 'Total'}>
                      <strong>{kind === 'promoter' ? row.attributedEarnings : row.total}</strong>
                    </td>
                    <td data-label="Status">
                      <span className={styles['status']} data-status={row.status.toLowerCase()}>
                        {row.status}
                      </span>
                    </td>
                    <td className={styles['rowActions']}>
                      <button
                        type="button"
                        disabled
                        aria-label={`Order ${row.id} actions`}
                        title="Order actions unavailable"
                      >
                        <RowActionsIcon size={19} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

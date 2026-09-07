'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { BackIcon, OrderIcon, RowActionsIcon, SearchIcon, SortableIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { venueOrders } from '../venue-orders-model';

import styles from './VenueOrders.module.css';

import type { VenueOrder, VenueOrderStatus } from '../venue-orders-model';

type SortKey = 'recent' | 'tickets' | 'total';
type StatusFilter = 'All statuses' | VenueOrderStatus;

const statusOptions: readonly StatusFilter[] = ['All statuses', 'Paid', 'Pending', 'Refunded'];

const canViewFinance = (permissions: readonly string[]): boolean =>
  permissions.length === 0 || permissions.includes('*') || permissions.includes('VIEW_FINANCIALS');

const sortOrders = (orders: readonly VenueOrder[], sort: SortKey): readonly VenueOrder[] => {
  if (sort === 'tickets') {
    return [...orders].sort((left, right) => right.ticketQuantity - left.ticketQuantity);
  }
  if (sort === 'total') {
    return [...orders].sort((left, right) => right.totalPaise - left.totalPaise);
  }
  return orders;
};

export function VenueOrdersScreen() {
  const auth = useDashboardAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('All statuses');
  const [sort, setSort] = useState<SortKey>('recent');
  const canView = canViewFinance(auth.grantedPermissions);

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    const filtered = venueOrders.filter((order) => {
      const matchesStatus = status === 'All statuses' || order.status === status;
      const matchesQuery =
        normalized.length === 0 ||
        [order.purchaser, order.email, order.id, order.event].some((value) =>
          value.toLocaleLowerCase('en-IN').includes(normalized),
        );
      return matchesStatus && matchesQuery;
    });
    return sortOrders(filtered, sort);
  }, [query, sort, status]);

  if (!canView) {
    return (
      <section className={styles['unavailable']} role="alert">
        <h1>Orders unavailable</h1>
        <p>Your current venue access does not include finance.</p>
      </section>
    );
  }

  return (
    <section className={styles['page']}>
      <header className={styles['pageHeader']}>
        <div>
          <Link href="/venue/finance" aria-label="Back to Finance">
            <BackIcon size={18} aria-hidden="true" /> Finance
          </Link>
          <h1>Orders</h1>
          <p>Every ticket order across your venue.</p>
        </div>
        <div className={styles['orderCount']}>
          <OrderIcon size={19} aria-hidden="true" />
          <span>All orders</span>
          <strong>{venueOrders.length}</strong>
        </div>
      </header>

      <section className={styles['ordersPanel']} aria-labelledby="all-orders-title">
        <header className={styles['panelHeader']}>
          <div>
            <h2 id="all-orders-title">All orders</h2>
            <span>{visibleOrders.length} shown</span>
          </div>
          <div className={styles['filters']}>
            <label className={styles['search']}>
              <span className={styles['srOnly']}>Search orders</span>
              <SearchIcon size={19} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Search by name or order #"
              />
            </label>
            <label className={styles['statusFilter']}>
              <span className={styles['srOnly']}>Filter by status</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {visibleOrders.length === 0 ? (
          <div className={styles['emptyState']}>
            <OrderIcon size={24} aria-hidden="true" />
            <strong>No matching orders</strong>
            <span>Try another customer, order number, event, or status.</span>
          </div>
        ) : (
          <div className={styles['tableWrap']}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Event</th>
                  <th scope="col">
                    <button
                      type="button"
                      data-active={sort === 'tickets'}
                      onClick={() => {
                        setSort(sort === 'tickets' ? 'recent' : 'tickets');
                      }}
                    >
                      Tickets <SortableIcon size={15} aria-hidden="true" />
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      data-active={sort === 'total'}
                      onClick={() => {
                        setSort(sort === 'total' ? 'recent' : 'total');
                      }}
                    >
                      Total <SortableIcon size={15} aria-hidden="true" />
                    </button>
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className={styles['srOnly']}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order">
                      <span className={styles['avatar']} aria-hidden="true">
                        {order.initials}
                      </span>
                      <span className={styles['orderIdentity']}>
                        <strong>{order.purchaser}</strong>
                        <small>
                          Order #{order.id} · {order.placedAt}
                        </small>
                      </span>
                    </td>
                    <td data-label="Event">{order.event}</td>
                    <td data-label="Tickets">{order.ticketQuantity}</td>
                    <td data-label="Total">
                      <strong>{order.total}</strong>
                    </td>
                    <td data-label="Status">
                      <span className={styles['status']} data-status={order.status.toLowerCase()}>
                        {order.status}
                      </span>
                    </td>
                    <td className={styles['rowActions']}>
                      <button
                        type="button"
                        disabled
                        aria-label={`Order ${order.id} actions`}
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

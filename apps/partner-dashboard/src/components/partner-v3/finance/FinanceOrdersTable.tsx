'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  ChevronDownIcon,
  ChevronUpIcon,
  RowActionsIcon,
  SearchIcon,
  SortableIcon,
} from '@c1rcle/icons';

import styles from './finance.module.css';
import { PayoutStatusBadge } from './PayoutStatusBadge';

import type { FinanceOrder, FinanceOrderStatus } from '@/data/partner-data-source';

type OrderStatusFilter = 'All' | FinanceOrderStatus;
type OrderSort = 'tickets' | 'amount';
type SortDirection = 'asc' | 'desc';

const statusFilters: readonly OrderStatusFilter[] = [
  'All',
  'Confirmed',
  'Pending',
  'Refunded',
  'Cancelled',
];
const avatarClasses: Record<FinanceOrder['avatarTone'], string | undefined> = {
  orange: styles['avatarOrange'],
  violet: styles['avatarViolet'],
  teal: styles['avatarTeal'],
  pink: styles['avatarPink'],
  gold: styles['avatarGold'],
  indigo: styles['avatarIndigo'],
};

function amountValue(amount: string): number {
  return Number(amount.replace(/[^\d]/g, ''));
}

function sortIcon(active: boolean, direction: SortDirection) {
  if (!active) return <SortableIcon size={12} aria-hidden="true" />;
  return direction === 'asc' ? (
    <ChevronUpIcon size={12} aria-hidden="true" />
  ) : (
    <ChevronDownIcon size={12} aria-hidden="true" />
  );
}

export function FinanceOrdersTable({
  rows,
  initialSearch = '',
  initialStatus = 'All',
  initialSort = null,
  initialDirection = 'desc',
}: {
  readonly rows: readonly FinanceOrder[];
  readonly initialSearch?: string;
  readonly initialStatus?: OrderStatusFilter;
  readonly initialSort?: OrderSort | null;
  readonly initialDirection?: SortDirection;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<OrderStatusFilter>(initialStatus);
  const [sort, setSort] = useState<OrderSort | null>(initialSort);
  const [direction, setDirection] = useState<SortDirection>(initialDirection);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const updateUrl = (next: {
    readonly search?: string;
    readonly status?: OrderStatusFilter;
    readonly sort?: OrderSort | null;
    readonly direction?: SortDirection;
  }) => {
    const params = new URLSearchParams({ view: 'orders' });
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? status;
    const nextSort = next.sort === undefined ? sort : next.sort;
    const nextDirection = next.direction ?? direction;
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextStatus !== 'All') params.set('status', nextStatus.toLowerCase());
    if (nextSort) {
      params.set('sort', nextSort);
      params.set('direction', nextDirection);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const visibleRows = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('en-IN');
    const filtered = rows.filter((row) => {
      const matchesStatus = status === 'All' || row.status === status;
      const matchesSearch =
        !normalized ||
        `${row.name} ${row.orderNumber} ${row.event}`
          .toLocaleLowerCase('en-IN')
          .includes(normalized);
      return matchesStatus && matchesSearch;
    });
    if (!sort) return filtered;
    return [...filtered].sort((left, right) => {
      const leftValue = sort === 'tickets' ? left.tickets : amountValue(left.amount);
      const rightValue = sort === 'tickets' ? right.tickets : amountValue(right.amount);
      return (leftValue - rightValue) * (direction === 'asc' ? 1 : -1);
    });
  }, [direction, rows, search, sort, status]);

  const updateSearch = (value: string) => {
    setSearch(value);
    updateUrl({ search: value });
  };
  const updateStatus = (value: OrderStatusFilter) => {
    setStatus(value);
    updateUrl({ status: value });
  };
  const updateSort = (value: OrderSort) => {
    const nextDirection = sort === value && direction === 'desc' ? 'asc' : 'desc';
    setSort(value);
    setDirection(nextDirection);
    updateUrl({ sort: value, direction: nextDirection });
  };

  return (
    <section className={styles['ordersSection']} aria-labelledby="orders-title">
      <div className={styles['ordersToolbar']}>
        <label className={styles['ordersSearch']}>
          <span className={styles['srOnly']}>Search orders</span>
          <SearchIcon size={15} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => {
              updateSearch(event.target.value);
            }}
            placeholder="Search by name or order #"
            type="search"
          />
        </label>
        <div
          className={styles['orderStatusFilters']}
          aria-label="Order status filters"
          role="group"
        >
          {statusFilters.map((filter) => (
            <button
              type="button"
              aria-pressed={status === filter}
              onClick={() => {
                updateStatus(filter);
              }}
              key={filter}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className={styles['ordersTableWrap']}>
        <table className={styles['ordersTable']}>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Event</th>
              <th scope="col">
                <button
                  type="button"
                  onClick={() => {
                    updateSort('tickets');
                  }}
                >
                  Tickets {sortIcon(sort === 'tickets', direction)}
                </button>
              </th>
              <th scope="col">
                <button
                  type="button"
                  onClick={() => {
                    updateSort('amount');
                  }}
                >
                  Total {sortIcon(sort === 'amount', direction)}
                </button>
              </th>
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
                  <span
                    className={[styles['orderAvatar'], avatarClasses[row.avatarTone]]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {row.initials}
                  </span>
                  <span className={styles['orderIdentity']}>
                    <strong>{row.name}</strong>
                    <small>
                      {row.orderNumber} · {row.date}
                    </small>
                  </span>
                </td>
                <td data-label="Event">{row.event}</td>
                <td data-label="Tickets">{row.tickets}</td>
                <td data-label="Total">
                  <strong>{row.amount}</strong>
                </td>
                <td data-label="Status">
                  <PayoutStatusBadge status={row.status} />
                </td>
                <td className={styles['orderActions']}>
                  <button
                    type="button"
                    aria-label={`Open actions for order ${row.orderNumber}`}
                    aria-expanded={openMenuId === row.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId((current) => (current === row.id ? null : row.id));
                    }}
                  >
                    <RowActionsIcon size={18} aria-hidden="true" />
                  </button>
                  {openMenuId === row.id ? (
                    <div className={styles['orderMenu']} role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        disabled
                        title="Order details are unavailable in fixture mode."
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled
                        title="Refunds require the order mutation API."
                      >
                        Refund
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled
                        title="Order cancellation requires the order mutation API."
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled
                        title="Ticket resend requires the order mutation API."
                      >
                        Resend ticket
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleRows.length === 0 ? (
          <div className={styles['financeEmpty']}>No orders match these filters.</div>
        ) : null}
      </div>
    </section>
  );
}

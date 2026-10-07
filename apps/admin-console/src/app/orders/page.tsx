'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  exportOrdersCsv,
  listOrders,
  ORDER_STATUSES,
  statusFilterOptions,
} from '@/lib/admin/admin-api';
import {
  formatDateTime,
  formatPaise,
  orderStatusTone,
  ORDER_STATUS_LABELS,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

import type { OrderStatus } from '@/lib/admin/contract-types';

type Filter = OrderStatus | 'all';

export default function OrdersDesk() {
  const [filter, setFilter] = useState<Filter>('all');

  const list = useQuery({
    queryKey: ['admin', 'orders', filter],
    queryFn: () => listOrders(100),
    select: (page) =>
      filter === 'all' ? page.items : page.items.filter((order) => order.status === filter),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportOrdersCsv(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Orders"
          description="Platform-wide orders, newest first. Read-only — refunding happens on the Refunds desk; the order's refund state (refundedPaise and the refund_requested/refunded status) is carried on the order itself."
        />
        <div className="flex items-center gap-2">
          <StatusFilter
            id="order-status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              ...statusFilterOptions(ORDER_STATUS_LABELS, ORDER_STATUSES),
            ]}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exportMutation.isPending}
            onClick={() => {
              exportMutation.mutate();
            }}
            aria-busy={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {list.isPending ? (
        <LoadingState label="Loading orders…" />
      ) : list.isError ? (
        <ErrorState
          description="Orders could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.length === 0 ? (
        <EmptyState title="No orders" description="Nothing matches this filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Order
                </th>
                <th scope="col" className="px-4 py-3">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Tickets
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Charged
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Refunded
                </th>
                <th scope="col" className="px-4 py-3">
                  Payment
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Placed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(order.id)}
                    <p className="font-sans text-xs">
                      <span className="capitalize">{shortId(order.eventId)}</span> event ·{' '}
                      {shortId(order.organizationId)} org
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.contact.name}</p>
                    <p className="text-xs text-muted-foreground">{order.contact.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right">{order.ticketCount}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPaise(order.grandTotalPaise)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {order.refundedPaise > 0 ? (
                      <span className="text-muted-foreground">
                        {formatPaise(order.refundedPaise)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {order.paymentId !== null ? shortId(order.paymentId) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={ORDER_STATUS_LABELS[order.status]}
                      tone={orderStatusTone(order.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exportMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The CSV could not be generated. Please retry.
        </p>
      ) : null}
    </div>
  );
}

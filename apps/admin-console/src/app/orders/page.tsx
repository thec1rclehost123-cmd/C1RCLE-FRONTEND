'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  exportOrdersCsv,
  findOrderByBookingReference,
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
  const [bookingReferenceInput, setBookingReferenceInput] = useState('');
  const [investigationReference, setInvestigationReference] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'orders', filter],
    queryFn: () => listOrders(100),
    select: (page) =>
      filter === 'all' ? page.items : page.items.filter((order) => order.status === filter),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportOrdersCsv(),
  });

  const investigation = useQuery({
    queryKey: ['admin', 'orders', 'promoter-investigation', investigationReference],
    queryFn: () => {
      if (investigationReference === null) throw new Error('No booking reference selected');
      return findOrderByBookingReference(investigationReference);
    },
    enabled: investigationReference !== null,
    retry: false,
  });

  const submitInvestigation = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reference = bookingReferenceInput.trim().toUpperCase();
    if (reference) setInvestigationReference(reference);
  };

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

      <section className="rounded-lg border border-border p-4">
        <h2 className="font-semibold">Promoter order investigation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Look up an exact booking reference to inspect verified attribution and its journal and
          reversal evidence.
        </p>
        <form onSubmit={submitInvestigation} className="mt-3 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="booking-reference">
            Booking reference
          </label>
          <input
            id="booking-reference"
            value={bookingReferenceInput}
            onChange={(event) => {
              setBookingReferenceInput(event.target.value);
            }}
            placeholder="C1-ABCDE-12345-67890-F0123"
            autoComplete="off"
            maxLength={64}
            className="min-w-64 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" size="sm" disabled={!bookingReferenceInput.trim()}>
            Find order
          </Button>
        </form>
        {investigation.isPending && investigationReference ? (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            Looking up {investigationReference}…
          </p>
        ) : null}
        {investigation.isError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            Order lookup failed. Check the booking reference and your Admin access, then retry.
          </p>
        ) : null}
        {investigation.data ? (
          <div className="mt-4 grid gap-4 border-t border-border pt-4 lg:grid-cols-2">
            <div>
              <h3 className="font-medium">Order {investigation.data.bookingReference}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {investigation.data.order.status} ·{' '}
                {formatPaise(investigation.data.order.grandTotalPaise)}
                {' · '}refunded {formatPaise(investigation.data.order.refundedPaise)}
              </p>
              {investigation.data.attribution ? (
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Promoter</dt>
                  <dd className="font-mono">{investigation.data.attribution.promoterId}</dd>
                  <dt className="text-muted-foreground">Assignment</dt>
                  <dd className="font-mono">
                    {investigation.data.attribution.assignmentId} · v
                    {investigation.data.attribution.assignmentVersion}
                  </dd>
                  <dt className="text-muted-foreground">Referral code</dt>
                  <dd>{investigation.data.attribution.code}</dd>
                  <dt className="text-muted-foreground">Frozen commission</dt>
                  <dd>{formatPaise(investigation.data.attribution.promoterCommissionPaise)}</dd>
                  <dt className="text-muted-foreground">Policy</dt>
                  <dd>
                    {investigation.data.attribution.commissionPolicyVersion} /{' '}
                    {investigation.data.attribution.commercialPolicyVersion}
                  </dd>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No verified Promoter attribution was stored on this order.
                </p>
              )}
            </div>
            <div>
              <h3 className="font-medium">Financial journals and reversals</h3>
              {investigation.data.journals.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No journal entries are recorded for this order.
                </p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {investigation.data.journals.map((journal) => (
                    <li key={journal.id} className="rounded-md bg-muted/40 p-2">
                      <span className="font-mono">{journal.sourceType}</span> · promoter allocation{' '}
                      {journal.componentPromoterCommissionPaise === null
                        ? 'not present'
                        : formatPaise(journal.componentPromoterCommissionPaise)}
                      {journal.reversalOfJournalId
                        ? ` · reverses ${journal.reversalOfJournalId}`
                        : ''}
                      <p className="text-xs text-muted-foreground">
                        {journal.id} · {journal.commissionPolicyVersion ?? 'legacy policy'} ·{' '}
                        {formatDateTime(journal.postedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </section>

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

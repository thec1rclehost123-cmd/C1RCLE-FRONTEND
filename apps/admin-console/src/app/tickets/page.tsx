'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import { listTickets, statusFilterOptions, TICKET_STATUSES } from '@/lib/admin/admin-api';
import {
  formatDateTime,
  shortId,
  StatusBadge,
  ticketStatusTone,
  TICKET_STATUS_LABELS,
} from '@/lib/admin/format';

import type { TicketStatus } from '@/lib/admin/contract-types';

type Filter = TicketStatus | 'all';

export default function TicketsDesk() {
  const [filter, setFilter] = useState<Filter>('all');

  const list = useQuery({
    queryKey: ['admin', 'tickets', filter],
    queryFn: () => listTickets(100),
    select: (page) =>
      filter === 'all' ? page.items : page.items.filter((ticket) => ticket.status === filter),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Tickets"
          description="Platform-wide ticket ledger, newest first. The entitlement a guest presents at the door — distinct from a support ticket. Read-only."
        />
        <StatusFilter
          id="ticket-status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            ...statusFilterOptions(TICKET_STATUS_LABELS, TICKET_STATUSES),
          ]}
        />
      </div>

      {list.isPending ? (
        <LoadingState label="Loading tickets…" />
      ) : list.isError ? (
        <ErrorState
          description="Tickets could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.length === 0 ? (
        <EmptyState title="No tickets" description="Nothing matches this filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Ticket
                </th>
                <th scope="col" className="px-4 py-3">
                  Holder
                </th>
                <th scope="col" className="px-4 py-3">
                  Tier
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Scans
                </th>
                <th scope="col" className="px-4 py-3">
                  Last scanned
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Issued
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(ticket.id)}
                    <p className="font-sans text-xs">
                      {shortId(ticket.orderId)} order · {shortId(ticket.eventId)} event
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{ticket.holderName}</p>
                  </td>
                  <td className="px-4 py-3">{ticket.tierName}</td>
                  <td className="px-4 py-3 text-right">
                    {ticket.scanCount}/{ticket.scanCountAllowed}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.lastScannedAt !== null ? formatDateTime(ticket.lastScannedAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={TICKET_STATUS_LABELS[ticket.status]}
                      tone={ticketStatusTone(ticket.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

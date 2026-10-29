'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import {
  listEvents,
  getEventCoverReconciliation,
  exportEventsCsv,
  forceCompleteEvent,
  pauseEvent,
  resumeEvent,
} from '@/lib/admin/admin-api';
import {
  formatDateTime,
  formatPaise,
  shortId,
  StatusBadge,
  EVENT_STATUS_LABELS,
  eventStatusTone,
} from '@/lib/admin/format';

const PAUSABLE = new Set(['published', 'sales_paused']);
const FORCE_COMPLETABLE = new Set(['published', 'sales_paused', 'started']);

export default function EventsDesk() {
  const queryClient = useQueryClient();
  const [reconciliationEventId, setReconciliationEventId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => listEvents(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const pauseMutation = useMutation({
    mutationFn: (eventId: string) => pauseEvent(eventId),
    onSuccess: invalidate,
  });

  const resumeMutation = useMutation({
    mutationFn: (eventId: string) => resumeEvent(eventId),
    onSuccess: invalidate,
  });

  const forceCompleteMutation = useMutation({
    mutationFn: (eventId: string) => forceCompleteEvent(eventId),
    onSuccess: invalidate,
  });

  const exportMutation = useMutation({
    mutationFn: () => exportEventsCsv(),
  });

  const coverReconciliation = useQuery({
    queryKey: ['admin', 'event-cover-reconciliation', reconciliationEventId],
    queryFn: () => {
      if (reconciliationEventId === null) {
        return Promise.reject(new Error('Select an event before loading cover reconciliation'));
      }
      return getEventCoverReconciliation(reconciliationEventId);
    },
    enabled: reconciliationEventId !== null,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Events"
          description="Every event across the platform. Pause/resume is a Tier-1 admin override — any active admin, recorded to the audit trail, distinguishable from a partner's own self-pause."
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

      {reconciliationEventId !== null ? (
        <section
          aria-labelledby="event-cover-reconciliation-title"
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="event-cover-reconciliation-title" className="font-semibold">
                Event cover reconciliation
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Read-only ledger totals. Redemption value remains held and is not Venue payout
                availability.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setReconciliationEventId(null);
              }}
            >
              Close
            </Button>
          </div>
          {coverReconciliation.isPending ? (
            <LoadingState label="Reconciling event cover…" />
          ) : coverReconciliation.isError ? (
            <ErrorState
              description="Event cover totals could not be loaded. Please retry."
              onRetry={() => {
                void coverReconciliation.refetch();
              }}
            />
          ) : (
            <div className="mt-4 space-y-3">
              <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                {[
                  [
                    'Accounts',
                    `${String(coverReconciliation.data.scannedAccountCount)} / ${String(coverReconciliation.data.accountCount)}`,
                  ],
                  ['Issued', formatPaise(coverReconciliation.data.issuedPaise)],
                  ['Remaining', formatPaise(coverReconciliation.data.remainingPaise)],
                  ['Reserved', formatPaise(coverReconciliation.data.reservedPaise)],
                  ['Redeemed', formatPaise(coverReconciliation.data.redeemedPaise)],
                  ['Refunded', formatPaise(coverReconciliation.data.refundedPaise)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <p role="status" className="text-sm">
                {coverReconciliation.data.balanced && !coverReconciliation.data.truncated
                  ? `All ${String(coverReconciliation.data.accountCount)} scanned accounts balance. Settlement is held and ineligible.`
                  : `Review required: ${String(coverReconciliation.data.unbalancedAccountCount)} account discrepancies; ${coverReconciliation.data.truncated ? 'the scan reached its 1,000 account limit' : 'settlement remains held and ineligible'}.`}
              </p>
              {coverReconciliation.data.heldRedemptionPaise !== null ? (
                <p className="text-sm text-muted-foreground">
                  Balanced redemption entries held:{' '}
                  {formatPaise(coverReconciliation.data.heldRedemptionPaise)}
                </p>
              ) : null}
              {coverReconciliation.data.discrepancies.length > 0 ? (
                <ul className="list-inside list-disc text-sm text-destructive">
                  {coverReconciliation.data.discrepancies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {list.isPending ? (
        <LoadingState label="Loading events…" />
      ) : list.isError ? (
        <ErrorState
          description="Events could not be loaded. Please retry."
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No events" description="Nothing is published yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Event
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Public
                </th>
                <th scope="col" className="px-4 py-3">
                  Price
                </th>
                <th scope="col" className="px-4 py-3">
                  Starts
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{event.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {event.slug} · {event.venueId === null ? 'no venue' : shortId(event.venueId)}{' '}
                      venue
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={EVENT_STATUS_LABELS[event.status]}
                      tone={eventStatusTone(event.status)}
                    />
                    {event.adminOverride ? (
                      <p className="mt-1 text-xs text-muted-foreground">Admin override</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.isPublic ? 'Public' : 'Private'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.isFree
                      ? 'Free'
                      : event.startingPricePaise === null
                        ? '—'
                        : `from ${formatPaise(event.startingPricePaise)}`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(event.startAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        aria-expanded={reconciliationEventId === event.id}
                        onClick={() => {
                          setReconciliationEventId(event.id);
                        }}
                      >
                        Reconcile cover
                      </Button>
                      {PAUSABLE.has(event.status) || FORCE_COMPLETABLE.has(event.status) ? (
                        <>
                          {event.status === 'sales_paused' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={resumeMutation.isPending}
                              onClick={() => {
                                resumeMutation.mutate(event.id);
                              }}
                              aria-busy={resumeMutation.isPending}
                            >
                              {resumeMutation.isPending ? 'Resuming…' : 'Resume'}
                            </Button>
                          ) : event.status === 'published' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pauseMutation.isPending}
                              onClick={() => {
                                pauseMutation.mutate(event.id);
                              }}
                              aria-busy={pauseMutation.isPending}
                            >
                              {pauseMutation.isPending ? 'Pausing…' : 'Pause'}
                            </Button>
                          ) : null}
                          {FORCE_COMPLETABLE.has(event.status) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={forceCompleteMutation.isPending}
                              onClick={() => {
                                forceCompleteMutation.mutate(event.id);
                              }}
                              aria-busy={forceCompleteMutation.isPending}
                              title="Force-end a past event whose lifecycle never transitioned"
                            >
                              {forceCompleteMutation.isPending ? 'Completing…' : 'Force complete'}
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pauseMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The event could not be paused. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}
      {resumeMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The event could not be resumed. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}
      {forceCompleteMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The event could not be force-completed. It is safe to retry — the request is
          idempotency-keyed.
        </p>
      ) : null}
      {exportMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The CSV could not be generated. Please retry.
        </p>
      ) : null}
    </div>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listEvents, forceCompleteEvent, pauseEvent, resumeEvent } from '@/lib/admin/admin-api';
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Events"
        description="Every event across the platform. Pause/resume is a Tier-1 admin override — any active admin, recorded to the audit trail, distinguishable from a partner's own self-pause."
      />

      {list.isPending ? (
        <LoadingState label="Loading events…" />
      ) : list.isError ? (
        <ErrorState
          description="Events could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
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
                    {!PAUSABLE.has(event.status) && !FORCE_COMPLETABLE.has(event.status) ? (
                      <p className="text-right text-xs text-muted-foreground">—</p>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
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
                      </div>
                    )}
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
    </div>
  );
}

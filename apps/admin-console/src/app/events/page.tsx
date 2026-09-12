'use client';

import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listEvents } from '@/lib/admin/admin-api';
import {
  formatDateTime,
  formatPaise,
  shortId,
  StatusBadge,
  EVENT_STATUS_LABELS,
  eventStatusTone,
} from '@/lib/admin/format';

export default function EventsDesk() {
  const list = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => listEvents(),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Events"
        description="Every event across the platform. Lifecycle and pricing at a glance; sales pausing is deferred until the force-pause control lands."
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

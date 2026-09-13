'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listVenues, reinstateVenue, suspendVenue } from '@/lib/admin/admin-api';
import {
  formatDateTime,
  shortId,
  StatusBadge,
  venueStatusTone,
  VENUE_STATUS_LABELS,
} from '@/lib/admin/format';

interface Suspending {
  readonly venueId: string;
}

export default function VenuesDesk() {
  const queryClient = useQueryClient();
  const [suspending, setSuspending] = useState<Suspending | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'venues'],
    queryFn: () => listVenues(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'venues'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const suspendMutation = useMutation({
    mutationFn: () => {
      if (suspending === null) {
        throw new Error('No venue selected');
      }
      return suspendVenue(suspending.venueId);
    },
    onSuccess: () => {
      setSuspending(null);
      invalidate();
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: (venueId: string) => reinstateVenue(venueId),
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Venues"
          description="All registered venues. Suspending is a Tier-2 command — a single ops/admin decision, recorded to the audit trail, and idempotent (a repeat suspend is a no-op)."
        />
      </div>

      {list.isPending ? (
        <LoadingState label="Loading venues…" />
      ) : list.isError ? (
        <ErrorState
          description="Venues could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No venues" description="Nothing is registered yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Venue
                </th>
                <th scope="col" className="px-4 py-3">
                  City
                </th>
                <th scope="col" className="px-4 py-3">
                  Capacity
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
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
              {list.data.items.map((venue) => (
                <tr key={venue.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{venue.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {venue.slug} · {shortId(venue.organizationId)} org
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{venue.city ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {venue.capacity === null ? '—' : venue.capacity.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={VENUE_STATUS_LABELS[venue.status]}
                      tone={venueStatusTone(venue.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(venue.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {venue.status === 'active' ? (
                      <div className="flex justify-end gap-2">
                        {suspending?.venueId === venue.id ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={suspendMutation.isPending}
                              onClick={() => {
                                setSuspending(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={suspendMutation.isPending}
                              onClick={() => {
                                suspendMutation.mutate();
                              }}
                              aria-busy={suspendMutation.isPending}
                            >
                              {suspendMutation.isPending ? 'Suspending…' : 'Confirm suspend'}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSuspending({ venueId: venue.id });
                              }}
                            >
                              Suspend
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reinstateMutation.isPending}
                          onClick={() => {
                            reinstateMutation.mutate(venue.id);
                          }}
                          aria-busy={reinstateMutation.isPending}
                        >
                          {reinstateMutation.isPending ? 'Reinstating…' : 'Reinstate'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {suspendMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The venue could not be suspended. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}
      {reinstateMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The venue could not be reinstated. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}
    </div>
  );
}

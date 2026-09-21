'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import {
  exportPromotersCsv,
  listPromoterAssignments,
  reinstatePromoter,
  suspendPromoter,
} from '@/lib/admin/admin-api';
import {
  formatDateTime,
  formatPaise,
  promoterAssignmentStatusTone,
  PROMOTER_ASSIGNMENT_STATUS_LABELS,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

interface Suspending {
  readonly promoterId: string;
}

export default function PromotersDesk() {
  const queryClient = useQueryClient();
  const [suspending, setSuspending] = useState<Suspending | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'promoters'],
    queryFn: () => listPromoterAssignments(100),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'promoters'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const suspendMutation = useMutation({
    mutationFn: () => {
      if (suspending === null) {
        throw new Error('No promoter selected');
      }
      return suspendPromoter(suspending.promoterId);
    },
    onSuccess: () => {
      setSuspending(null);
      invalidate();
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: (promoterId: string) => reinstatePromoter(promoterId),
    onSuccess: invalidate,
  });

  const exportMutation = useMutation({
    mutationFn: () => exportPromotersCsv(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Promoters"
          description="Platform-wide promoter assignments, across every event. V2 has no standalone promoter entity — a promoter is an organization member with a versioned commission assignment per event. Suspending a promoter bulk-transitions all of their assignments — a Tier-2 command, idempotent (a repeat suspend is a no-op)."
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

      {list.isPending ? (
        <LoadingState label="Loading promoter assignments…" />
      ) : list.isError ? (
        <ErrorState
          description="Promoter assignments could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No promoter assignments" description="Nothing has been assigned yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Promoter
                </th>
                <th scope="col" className="px-4 py-3">
                  Event
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Rate
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Flat fee
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Assigned
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(assignment.promoterId)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(assignment.eventId)}
                  </td>
                  <td className="px-4 py-3 text-right">{assignment.ratePercent}%</td>
                  <td className="px-4 py-3 text-right">
                    {assignment.flatPaise > 0 ? formatPaise(assignment.flatPaise) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={PROMOTER_ASSIGNMENT_STATUS_LABELS[assignment.status]}
                      tone={promoterAssignmentStatusTone(assignment.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(assignment.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {assignment.status === 'active' ? (
                      <div className="flex justify-end gap-2">
                        {suspending?.promoterId === assignment.promoterId ? (
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
                                setSuspending({ promoterId: assignment.promoterId });
                              }}
                            >
                              Suspend
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : assignment.status === 'suspended' ? (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reinstateMutation.isPending}
                          onClick={() => {
                            reinstateMutation.mutate(assignment.promoterId);
                          }}
                          aria-busy={reinstateMutation.isPending}
                        >
                          {reinstateMutation.isPending ? 'Reinstating…' : 'Reinstate'}
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {suspendMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The promoter could not be suspended. It is safe to retry — the request is
          idempotency-keyed.
        </p>
      ) : null}
      {reinstateMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The promoter could not be reinstated. It is safe to retry — the request is
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

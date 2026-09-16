'use client';

import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listPromoterAssignments } from '@/lib/admin/admin-api';
import {
  formatDateTime,
  formatPaise,
  promoterAssignmentStatusTone,
  PROMOTER_ASSIGNMENT_STATUS_LABELS,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

export default function PromotersDesk() {
  const list = useQuery({
    queryKey: ['admin', 'promoters'],
    queryFn: () => listPromoterAssignments(100),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Promoters"
        description="Platform-wide promoter assignments, across every event. V2 has no standalone promoter entity — a promoter is an organization member with a versioned commission assignment per event. Read-only."
      />

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

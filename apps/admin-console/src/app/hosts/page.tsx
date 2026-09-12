'use client';

import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listHosts } from '@/lib/admin/admin-api';
import {
  formatDateTime,
  shortId,
  StatusBadge,
  HOST_STATUS_LABELS,
  hostStatusTone,
} from '@/lib/admin/format';

export default function HostsDesk() {
  const list = useQuery({
    queryKey: ['admin', 'hosts'],
    queryFn: () => listHosts(),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hosts"
        description="Organizer organizations and their platform fee. List-only for now; commission adjustments are a Tier-3 proposal action, not a direct edit."
      />

      {list.isPending ? (
        <LoadingState label="Loading hosts…" />
      ) : list.isError ? (
        <ErrorState
          description="Hosts could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No hosts" description="No organizer organizations yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Host
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Platform fee
                </th>
                <th scope="col" className="px-4 py-3">
                  Members
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((host) => (
                <tr key={host.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{host.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {host.slug} · owner {shortId(host.ownerId)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={HOST_STATUS_LABELS[host.status]}
                      tone={hostStatusTone(host.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{host.platformFeePercent}%</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {host.memberCount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(host.createdAt)}
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

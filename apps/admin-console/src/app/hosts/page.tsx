'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listHosts, reinstateOrganization, suspendOrganization } from '@/lib/admin/admin-api';
import {
  formatDateTime,
  shortId,
  StatusBadge,
  HOST_STATUS_LABELS,
  hostStatusTone,
} from '@/lib/admin/format';

interface Suspending {
  readonly organizationId: string;
}

export default function HostsDesk() {
  const queryClient = useQueryClient();
  const [suspending, setSuspending] = useState<Suspending | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'hosts'],
    queryFn: () => listHosts(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'hosts'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const suspendMutation = useMutation({
    mutationFn: () => {
      if (suspending === null) {
        throw new Error('No organization selected');
      }
      return suspendOrganization(suspending.organizationId);
    },
    onSuccess: () => {
      setSuspending(null);
      invalidate();
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: (organizationId: string) => reinstateOrganization(organizationId),
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hosts"
        description="Organizer organizations and their platform fee. Suspend/reinstate are Tier-2 commands — a single ops/admin decision, recorded to the audit trail. Commission adjustments are a separate Tier-3 proposal action, not a direct edit."
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
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
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
                  <td className="px-4 py-3">
                    {host.status === 'archived' ? (
                      <p className="text-right text-xs text-muted-foreground">—</p>
                    ) : host.status === 'active' ? (
                      suspending?.organizationId === host.id ? (
                        <div className="flex justify-end items-center gap-2">
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
                              setSuspending({ organizationId: host.id });
                            }}
                          >
                            Suspend
                          </Button>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reinstateMutation.isPending}
                          onClick={() => {
                            reinstateMutation.mutate(host.id);
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
          The organization could not be suspended. It is safe to retry — the request is
          idempotency-keyed.
        </p>
      ) : null}
      {reinstateMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The organization could not be reinstated. It is safe to retry — the request is
          idempotency-keyed.
        </p>
      ) : null}
    </div>
  );
}

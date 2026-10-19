'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  listReconciliationDiscrepancies,
  resolveReconciliationDiscrepancy,
  retryReconciliationDiscrepancy,
  runReconciliation,
} from '@/lib/admin/admin-api';
import { formatDateTime, formatPaise, shortId, StatusBadge } from '@/lib/admin/format';

import type { ReconciliationDiscrepancyState } from '@/lib/admin/admin-api';

type Filter = ReconciliationDiscrepancyState | 'all';

export default function ReconciliationDesk() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('open');
  const [resolving, setResolving] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const list = useQuery({
    queryKey: ['admin', 'reconciliation', filter],
    queryFn: () => listReconciliationDiscrepancies(filter),
  });
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['admin', 'reconciliation'] });
  const run = useMutation({ mutationFn: runReconciliation, onSuccess: invalidate });
  const retry = useMutation({
    mutationFn: retryReconciliationDiscrepancy,
    onSuccess: invalidate,
  });
  const resolve = useMutation({
    mutationFn: () => {
      if (!resolving) throw new Error('No discrepancy selected');
      return resolveReconciliationDiscrepancy(resolving, reason.trim());
    },
    onSuccess: () => {
      setResolving(null);
      setReason('');
      invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Financial reconciliation"
          description="Compare provider facts, orders, tickets, journals and payouts. Repairs are limited to safe rechecks; manual resolution always requires a reason."
        />
        <div className="flex items-center gap-2">
          <StatusFilter
            id="reconciliation-state"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Open' },
              { value: 'finance_review', label: 'Finance review' },
              { value: 'support_required', label: 'Support required' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
          <Button
            size="sm"
            disabled={run.isPending}
            onClick={() => {
              run.mutate();
            }}
          >
            {run.isPending ? 'Running…' : 'Run reconciliation'}
          </Button>
        </div>
      </div>

      {list.isPending ? (
        <LoadingState label="Loading discrepancies…" />
      ) : list.isError ? (
        <ErrorState
          description="Reconciliation could not be loaded."
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No discrepancies" description="Nothing matches this filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Discrepancy</th>
                <th className="px-4 py-3">Evidence</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.kind.replaceAll('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </td>
                  <td className="max-w-md px-4 py-3 text-xs text-muted-foreground">
                    {Object.entries(item.evidence)
                      .slice(0, 4)
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(' · ') || 'No additional evidence'}
                  </td>
                  <td className="px-4 py-3">
                    {item.amountPaise === null ? '—' : formatPaise(item.amountPaise)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={item.state.replaceAll('_', ' ')} tone="warning" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {resolving === item.id ? (
                      <div className="flex flex-col items-end gap-2">
                        <TextField
                          label="Resolution reason"
                          value={reason}
                          onChange={(event) => {
                            setReason(event.target.value);
                          }}
                          className="w-72"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResolving(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={!reason.trim() || resolve.isPending}
                            onClick={() => {
                              resolve.mutate();
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ) : item.state === 'resolved' ? (
                      <span className="text-xs text-muted-foreground">
                        {item.resolutionReason ?? 'Resolved'}
                      </span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {item.repair === 'recheck_evidence' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={retry.isPending}
                            onClick={() => {
                              retry.mutate(item.id);
                            }}
                          >
                            Recheck
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResolving(item.id);
                          }}
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                    <span className="sr-only">{shortId(item.id)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {run.isError || retry.isError || resolve.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The reconciliation action failed. No discrepancy was silently cleared.
        </p>
      ) : null}
    </div>
  );
}

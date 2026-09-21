'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  DISPUTE_STATUSES,
  listDisputes,
  resolveDispute,
  statusFilterOptions,
} from '@/lib/admin/admin-api';
import {
  DISPUTE_RESOLUTION_LABELS,
  DISPUTE_STATUS_LABELS,
  disputeStatusTone,
  formatDateTime,
  formatPaise,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

import type { DisputeResolutionOutcome, DisputeStatus } from '@/lib/admin/contract-types';

type Filter = DisputeStatus | 'all';

interface Resolving {
  readonly disputeId: string;
  readonly outcome: DisputeResolutionOutcome;
}

export default function DisputesDesk() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('open');
  const [resolving, setResolving] = useState<Resolving | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const list = useQuery({
    queryKey: ['admin', 'disputes', filter],
    queryFn: () => listDisputes(filter),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const resolveMutation = useMutation({
    mutationFn: () => {
      if (resolving === null) {
        throw new Error('No dispute selected');
      }
      return resolveDispute({
        disputeId: resolving.disputeId,
        outcome: resolving.outcome,
        resolutionNote: resolutionNote.trim(),
      });
    },
    onSuccess: () => {
      setResolving(null);
      setResolutionNote('');
      invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Disputes"
          description="Disputes are TIER2 — any admin may resolve. An upheld dispute writes a correcting ledger entry restoring the guest balance; a denied dispute leaves the ledger untouched."
        />
        <StatusFilter
          id="dispute-status"
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'All' }, ...statusFilterOptions(DISPUTE_STATUS_LABELS, DISPUTE_STATUSES)]}
        />
      </div>

      {list.isPending ? (
        <LoadingState label="Loading disputes…" />
      ) : list.isError ? (
        <ErrorState
          description="Disputes could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No disputes" description="Nothing matches this filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Order
                </th>
                <th scope="col" className="px-4 py-3">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3">
                  Reason
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Raised
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((dispute) => (
                <tr key={dispute.id}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(dispute.orderId)}
                    <p className="font-sans text-xs">
                      <span className="capitalize">{dispute.raisedBy}</span> ·{' '}
                      {shortId(dispute.organizationId)} org
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPaise(dispute.amountPaise)}</td>
                  <td className="max-w-md px-4 py-3 text-muted-foreground">{dispute.reason}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={DISPUTE_STATUS_LABELS[dispute.status]} tone={disputeStatusTone(dispute.status)} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(dispute.createdAt)}</td>
                  <td className="px-4 py-3">
                    {dispute.status !== 'resolved' ? (
                      <div className="flex justify-end gap-2">
                        {resolving?.disputeId === dispute.id ? (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              {(['upheld', 'denied'] as const).map((outcome) => (
                                <Button
                                  key={outcome}
                                  size="sm"
                                  variant={outcome === 'upheld' ? 'primary' : 'outline'}
                                  onClick={() => {
                                    setResolving({ disputeId: dispute.id, outcome });
                                  }}
                                >
                                  {DISPUTE_RESOLUTION_LABELS[outcome]}
                                </Button>
                              ))}
                            </div>
                            <TextField
                              label="Resolution note (required)"
                              value={resolutionNote}
                              onChange={(event) => { setResolutionNote(event.target.value); }}
                              placeholder="Why is this dispute being resolved this way?"
                              className="w-80"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setResolving(null);
                                  setResolutionNote('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant={resolving.outcome === 'upheld' ? 'primary' : 'destructive'}
                                disabled={resolveMutation.isPending || resolutionNote.trim() === ''}
                                onClick={() => { resolveMutation.mutate(); }}
                              >
                                {resolveMutation.isPending
                                  ? 'Resolving…'
                                  : `Confirm ${resolving.outcome}`}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setResolving({ disputeId: dispute.id, outcome: 'denied' });
                              setResolutionNote('');
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-right text-xs text-muted-foreground">
                        {dispute.resolutionNote ?? '—'}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resolveMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The resolution could not be saved. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}
    </div>
  );
}
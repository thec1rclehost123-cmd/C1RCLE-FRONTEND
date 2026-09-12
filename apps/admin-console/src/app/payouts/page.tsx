'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  listPayouts,
  PAYOUT_STATUSES,
  raiseProposal,
  runPayoutBatch,
  statusFilterOptions,
} from '@/lib/admin/admin-api';
import {
  formatDateTime,
  formatPaise,
  payoutStatusTone,
  PAYOUT_STATUS_LABELS,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

import type { AdminAction, AdminPayoutStatus } from '@/lib/admin/contract-types';

type Filter = AdminPayoutStatus | 'all';

interface Raising {
  readonly payoutId: string;
  readonly mode: 'freeze' | 'release';
}

/** Payouts that can still be pushed through the payment provider. */
const RUNNABLE = new Set<AdminPayoutStatus>(['requested', 'processing', 'failed']);

export default function PayoutsDesk() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [raising, setRaising] = useState<Raising | null>(null);
  const [reason, setReason] = useState('');
  const [raisedFor, setRaisedFor] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'payouts', filter],
    queryFn: () => listPayouts(filter),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'proposals'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const runMutation = useMutation({
    mutationFn: (payoutId: string) => runPayoutBatch([payoutId]),
    onSuccess: () => {
      setRunning(null);
      invalidate();
    },
  });

  const raiseMutation = useMutation({
    mutationFn: () => {
      if (raising === null) {
        throw new Error('No payout selected');
      }
      const action: AdminAction = raising.mode === 'freeze' ? 'PAYOUT_FREEZE' : 'PAYOUT_RELEASE';
      return raiseProposal({
        action,
        reason: reason.trim(),
        payload: { payoutId: raising.payoutId },
      });
    },
    onSuccess: () => {
      setRaisedFor(raising?.payoutId ?? null);
      setRaising(null);
      setReason('');
      invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Payouts"
          description="Money owed to hosts. Running a payout is a Tier-2 single-admin command; freezing or releasing one is Tier-3 dual control and goes through a proposal."
        />
        <StatusFilter
          id="payout-status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            ...statusFilterOptions(PAYOUT_STATUS_LABELS, PAYOUT_STATUSES),
          ]}
        />
      </div>

      {list.isPending ? (
        <LoadingState label="Loading payouts…" />
      ) : list.isError ? (
        <ErrorState
          description="Payouts could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No payouts" description="Nothing matches this filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Payout
                </th>
                <th scope="col" className="px-4 py-3">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Requested
                </th>
                <th scope="col" className="px-4 py-3">
                  Processed
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((payout) => {
                const isRaising = raising?.payoutId === payout.id;
                const isRunning = running === payout.id;
                return (
                  <tr key={payout.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs">{shortId(payout.id)}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {shortId(payout.organizationId)} org
                      </p>
                      {raisedFor === payout.id ? (
                        <p className="mt-1 text-xs text-primary">
                          Proposal raised —{' '}
                          <Link href="/proposals" className="underline">
                            confirm on Proposals
                          </Link>
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPaise(payout.amountPaise)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={PAYOUT_STATUS_LABELS[payout.status]}
                        tone={payoutStatusTone(payout.status)}
                      />
                      {payout.status === 'failed' && payout.failureReason !== null ? (
                        <p className="mt-1 text-xs text-destructive">{payout.failureReason}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(payout.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payout.processedAt === null ? '—' : formatDateTime(payout.processedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isRaising ? (
                        <div className="flex flex-col items-end gap-2">
                          <TextField
                            label="Reason (required)"
                            value={reason}
                            onChange={(event) => {
                              setReason(event.target.value);
                            }}
                            placeholder={`Why is this ${raising.mode}?`}
                            className="w-72"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={raiseMutation.isPending}
                              onClick={() => {
                                setRaising(null);
                                setReason('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant={raising.mode === 'freeze' ? 'destructive' : 'primary'}
                              disabled={raiseMutation.isPending || reason.trim() === ''}
                              onClick={() => {
                                raiseMutation.mutate();
                              }}
                              aria-busy={raiseMutation.isPending}
                            >
                              {raiseMutation.isPending
                                ? 'Raising…'
                                : raising.mode === 'freeze'
                                  ? 'Raise freeze proposal'
                                  : 'Raise release proposal'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {RUNNABLE.has(payout.status) && !isRunning ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={runMutation.isPending}
                              onClick={() => {
                                setRunning(payout.id);
                                runMutation.mutate(payout.id);
                              }}
                            >
                              Run
                            </Button>
                          ) : null}
                          {isRunning ? (
                            <Button size="sm" variant="outline" disabled aria-busy>
                              Running…
                            </Button>
                          ) : null}
                          {payout.status === 'frozen' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRaising({ payoutId: payout.id, mode: 'release' });
                                setReason('');
                              }}
                            >
                              Release
                            </Button>
                          ) : RUNNABLE.has(payout.status) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRaising({ payoutId: payout.id, mode: 'freeze' });
                                setReason('');
                              }}
                            >
                              Freeze
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {runMutation.isError || raiseMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The action could not be completed. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {list.data?.items.length ?? 0} payout(s) shown. Freeze/release proposals need a second admin
        — approve them on the Proposals desk to execute.
      </p>
    </div>
  );
}

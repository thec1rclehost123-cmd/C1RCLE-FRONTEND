'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  approveProposal,
  cancelProposal,
  executePayoutProposal,
  isPayoutProposalAction,
  isProvisionAction,
  listProposals,
  PROPOSAL_STATUSES,
  provisionAdminFromProposal,
  rejectProposal,
  statusFilterOptions,
} from '@/lib/admin/admin-api';
import {
  StatusBadge,
  ADMIN_ACTION_LABELS,
  formatDateTime,
  proposalStatusTone,
  PROPOSAL_STATUS_LABELS,
} from '@/lib/admin/format';

import type { ProposalStatus } from '@/lib/admin/contract-types';
import type { ReactNode } from 'react';

type Filter = ProposalStatus | 'all';

interface Resolving {
  readonly proposalId: string;
  readonly mode: 'approve' | 'reject' | 'cancel';
}

function payloadSummary(payload: Record<string, unknown>): string {
  const entries = Object.entries(payload);
  if (entries.length === 0) {
    return '—';
  }
  return entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ');
}

export default function ProposalsDesk() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [resolving, setResolving] = useState<Resolving | null>(null);
  const [reason, setReason] = useState('');
  const [provisioningId, setProvisioningId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'proposals', filter],
    queryFn: () => listProposals(filter),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'proposals'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const resolveMutation = useMutation({
    mutationFn: () => {
      if (resolving === null) {
        throw new Error('No proposal selected');
      }
      const { proposalId, mode } = resolving;
      const resolutionReason = reason.trim();
      switch (mode) {
        case 'approve':
          return approveProposal(proposalId, resolutionReason);
        case 'reject':
          return rejectProposal(proposalId, resolutionReason);
        case 'cancel':
          return cancelProposal(proposalId);
      }
    },
    onSuccess: () => {
      setResolving(null);
      setReason('');
      invalidate();
    },
  });

  const provisionMutation = useMutation({
    mutationFn: (proposalId: string) => provisionAdminFromProposal(proposalId),
    onSuccess: () => {
      invalidate();
    },
  });

  const payoutExecutionMutation = useMutation({
    mutationFn: (proposalId: string) => {
      const proposal = list.data?.items.find((item) => item.id === proposalId);
      if (proposal === undefined) {
        throw new Error('Proposal not found');
      }
      return executePayoutProposal(proposal);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Proposals"
          description="Tier 3 actions need a second admin’s confirmation before execution. Resolve with a reason — it is locked into the audit trail."
        />
        <StatusFilter
          id="proposal-status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            ...statusFilterOptions(PROPOSAL_STATUS_LABELS, PROPOSAL_STATUSES),
          ]}
        />
      </div>

      {list.isPending ? (
        <LoadingState label="Loading proposals…" />
      ) : list.isError ? (
        <ErrorState
          description="Proposals could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No proposals" description="There is nothing waiting in this filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Action
                </th>
                <th scope="col" className="px-4 py-3">
                  Reason / payload
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
              {list.data.items.map((proposal) => {
                const isResolving = resolving?.proposalId === proposal.id;
                return (
                  <tr key={proposal.id}>
                    <td className="px-4 py-3 font-medium">
                      {ADMIN_ACTION_LABELS[proposal.action]}
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <p className="text-muted-foreground">{proposal.reason}</p>
                      <p className="font-mono text-xs text-muted-foreground/70">
                        {payloadSummary(proposal.payload)}
                      </p>
                      {descriptionOfResolution(proposal.status, proposal.resolutionReason)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={proposal.status}
                        tone={proposalStatusTone(proposal.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(proposal.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isResolving ? (
                        <div className="flex flex-col items-end gap-2">
                          {resolving.mode === 'reject' ? (
                            <TextField
                              label="Reason (required)"
                              value={reason}
                              onChange={(event) => {
                                setReason(event.target.value);
                              }}
                              placeholder="Why is this rejected?"
                              className="w-72"
                            />
                          ) : null}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setResolving(null);
                                setReason('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant={resolving.mode === 'reject' ? 'destructive' : 'primary'}
                              disabled={
                                resolveMutation.isPending ||
                                (resolving.mode === 'reject' && reason.trim() === '')
                              }
                              onClick={() => {
                                resolveMutation.mutate();
                              }}
                            >
                              Confirm
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {proposal.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  setResolving({ proposalId: proposal.id, mode: 'approve' });
                                  setReason('');
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setResolving({ proposalId: proposal.id, mode: 'reject' });
                                  setReason('');
                                }}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setResolving({ proposalId: proposal.id, mode: 'cancel' });
                                  setReason('');
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : proposal.status === 'approved' &&
                            isProvisionAction(proposal.action) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={provisionMutation.isPending}
                              onClick={() => {
                                setProvisioningId(proposal.id);
                                provisionMutation.mutate(proposal.id);
                              }}
                              aria-busy={
                                provisionMutation.isPending && provisioningId === proposal.id
                              }
                            >
                              {provisionMutation.isPending && provisioningId === proposal.id
                                ? 'Provisioning…'
                                : 'Provision admin'}
                            </Button>
                          ) : proposal.status === 'approved' &&
                            isPayoutProposalAction(proposal.action) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={payoutExecutionMutation.isPending}
                              onClick={() => {
                                payoutExecutionMutation.mutate(proposal.id);
                              }}
                              aria-busy={payoutExecutionMutation.isPending}
                            >
                              {payoutExecutionMutation.isPending
                                ? 'Executing…'
                                : proposal.action === 'PAYOUT_FREEZE'
                                  ? 'Freeze payout'
                                  : 'Release payout'}
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

      {resolveMutation.isError || payoutExecutionMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The action could not be completed. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {list.data?.items.length ?? 0} proposal(s) shown. Raising a proposal requires the correct
        admin role (gateway-enforced); every confirmation is written to the audit trail.
      </p>
    </div>
  );
}

function descriptionOfResolution(
  status: ProposalStatus,
  resolutionReason: string | null,
): ReactNode {
  if (status === 'pending') {
    return null;
  }
  return (
    <p className="mt-1 text-xs text-muted-foreground/70">
      {status === 'approved' ? 'Confirmed' : status} — {resolutionReason ?? 'no reason recorded'}
    </p>
  );
}

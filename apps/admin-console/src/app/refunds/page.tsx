'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  approveRefund,
  listRefunds,
  REFUND_STATUSES,
  rejectRefund,
  statusFilterOptions,
} from '@/lib/admin/admin-api';
import { formatDateTime, formatPaise, refundStatusTone, REFUND_STATUS_LABELS, shortId, StatusBadge } from '@/lib/admin/format';

import type { AdminRefundRequestStatus } from '@/lib/admin/contract-types';

type Filter = AdminRefundRequestStatus | 'all';

interface Rejecting {
  readonly refundId: string;
}

export default function RefundsDesk() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [rejecting, setRejecting] = useState<Rejecting | null>(null);
  const [reason, setReason] = useState('');

  const list = useQuery({
    queryKey: ['admin', 'refunds', filter],
    queryFn: () => listRefunds(filter),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const approveMutation = useMutation({
    mutationFn: (refundId: string) => approveRefund(refundId),
    onSuccess: () => { invalidate(); },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (rejecting === null) {
        throw new Error('No refund selected');
      }
      return rejectRefund(rejecting.refundId, reason.trim());
    },
    onSuccess: () => {
      setRejecting(null);
      setReason('');
      invalidate();
    },
  });

  const stagedAmount = (total: number) => formatPaise(total);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Refunds"
          description="Refund requests follow the v1 thresholds — under ₹500 auto-settles, under ₹5,000 needs one finance admin, above that needs two. Decisions here execute the actual money movement."
        />
        <StatusFilter
          id="refund-status"
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'All' }, ...statusFilterOptions(REFUND_STATUS_LABELS, REFUND_STATUSES)]}
        />
      </div>

      {list.isPending ? (
        <LoadingState label="Loading refund requests…" />
      ) : list.isError ? (
        <ErrorState
          description="Refund requests could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No refund requests" description="Nothing matches this filter." />
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
                  Approvals
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
              {list.data.items.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(request.orderId)}
                    <p className="font-sans text-xs">{shortId(request.organizationId)} org</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{stagedAmount(request.amountPaise)}</td>
                  <td className="max-w-md px-4 py-3 text-muted-foreground">
                    {request.reason}
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {request.status === 'rejected' && request.rejectionReason !== null
                        ? `Rejected: ${request.rejectionReason}`
                        : request.status === 'failed' && request.failureReason !== null
                          ? `Failed: ${request.failureReason}`
                          : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {request.approvals.length}/{request.approversRequired}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={request.status} tone={refundStatusTone(request.status)} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(request.createdAt)}</td>
                  <td className="px-4 py-3">
                    {request.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={approveMutation.isPending}
                          onClick={() => { approveMutation.mutate(request.id); }}
                        >
                          Approve
                        </Button>
                        {rejecting?.refundId === request.id ? (
                          <div className="flex flex-col items-end gap-2">
                            <TextField
                              label="Reason (required)"
                              value={reason}
                              onChange={(event) => { setReason(event.target.value); }}
                              placeholder="Why is this rejected?"
                              className="w-64"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejecting(null);
                                  setReason('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={rejectMutation.isPending || reason.trim() === ''}
                                onClick={() => { rejectMutation.mutate(); }}
                              >
                                Confirm rejection
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejecting({ refundId: request.id });
                              setReason('');
                            }}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-right text-xs text-muted-foreground">
                        {request.providerRefundId === null
                          ? '—'
                          : `Provider ${shortId(request.providerRefundId)}`}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approveMutation.isError || rejectMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The decision could not be saved. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}
    </div>
  );
}
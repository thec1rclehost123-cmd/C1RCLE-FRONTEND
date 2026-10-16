'use client';

import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listProviderChargebacks } from '@/lib/admin/admin-api';
import { formatDateTime, formatPaise, shortId, StatusBadge } from '@/lib/admin/format';

export default function ChargebacksDesk() {
  const list = useQuery({
    queryKey: ['admin', 'chargebacks'],
    queryFn: () => listProviderChargebacks(),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Provider chargebacks"
        description="Razorpay dispute cases and deadlines. Open cases hold related partner payable until provider resolution or reconciliation."
      />
      {list.isPending ? (
        <LoadingState label="Loading chargeback cases…" />
      ) : list.isError ? (
        <ErrorState
          description="Chargeback cases could not be loaded."
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No chargeback cases" description="No provider disputes are recorded." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Provider state</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Respond by</th>
                <th className="px-4 py-3">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((item) => (
                <tr key={`${item.paymentId}:${item.disputeId}`}>
                  <td className="px-4 py-3 font-mono text-xs">
                    {shortId(item.disputeId)}
                    <p className="text-muted-foreground">payment {shortId(item.paymentId)}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPaise(item.amountPaise)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={item.status.replaceAll('_', ' ')}
                      tone={
                        item.status === 'won'
                          ? 'success'
                          : item.status === 'lost'
                            ? 'destructive'
                            : 'warning'
                      }
                    />
                  </td>
                  <td className="max-w-sm px-4 py-3 text-muted-foreground">
                    {item.reasonCode ?? 'Not supplied'}
                    {item.reasonDescription ? <p>{item.reasonDescription}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.respondBy ? formatDateTime(item.respondBy) : 'Not supplied'}
                  </td>
                  <td className="px-4 py-3 capitalize">{item.evidenceState}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

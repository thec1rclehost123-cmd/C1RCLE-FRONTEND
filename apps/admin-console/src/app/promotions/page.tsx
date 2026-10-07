'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { exportPromotionsCsv, listPromotions } from '@/lib/admin/admin-api';
import { formatDateTime, shortId, StatusBadge } from '@/lib/admin/format';

export default function PromotionsDesk() {
  const list = useQuery({
    queryKey: ['admin', 'promotions'],
    queryFn: () => listPromotions(100),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportPromotionsCsv(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Promotions"
          description="Platform-wide promo codes, across every event. Read-only — codes are created by partners on their own event. Discount value is a percent when the type is percent, paise otherwise."
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
        <LoadingState label="Loading promotions…" />
      ) : list.isError ? (
        <ErrorState
          description="Promotions could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No promo codes" description="No partner has created one yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Code
                </th>
                <th scope="col" className="px-4 py-3">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Discount
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Redemptions
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((promo) => (
                <tr key={promo.id}>
                  <td className="px-4 py-3 font-mono text-xs">
                    {promo.code}
                    <p className="font-sans text-xs text-muted-foreground">
                      {promo.name} ·{' '}
                      {promo.eventId !== null ? shortId(promo.eventId) : 'all events'}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {promo.type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {promo.discountType === 'percent'
                      ? `${promo.discountValue.toString()}%`
                      : `₹${(promo.discountValue / 100).toLocaleString('en-IN')}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {promo.redemptionCount}
                    {promo.maxRedemptions !== null ? `/${promo.maxRedemptions.toString()}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={promo.isActive ? 'Active' : 'Inactive'}
                      tone={promo.isActive ? 'success' : 'muted'}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(promo.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exportMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The CSV could not be generated. Please retry.
        </p>
      ) : null}
    </div>
  );
}

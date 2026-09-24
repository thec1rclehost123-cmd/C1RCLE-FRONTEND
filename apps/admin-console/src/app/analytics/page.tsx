'use client';

import { useQuery } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { getAnalyticsSummary } from '@/lib/admin/admin-api';
import { formatPaise, shortId } from '@/lib/admin/format';

function StatCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AnalyticsDesk() {
  const summary = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => getAnalyticsSummary(),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Platform-wide revenue, tickets, and active events. Bounded to the most recent orders/events/hosts — a snapshot for ops decisions, not a full ledger."
      />

      {summary.isPending ? (
        <LoadingState label="Loading summary…" />
      ) : summary.isError ? (
        <ErrorState
          description="The summary could not be loaded. Please retry."
          onRetry={() => void summary.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Net revenue" value={formatPaise(summary.data.totalRevenuePaise)} />
            <StatCard
              label="Tickets sold"
              value={summary.data.ticketsSold.toLocaleString('en-IN')}
            />
            <StatCard
              label="Active events"
              value={summary.data.activeEventsCount.toLocaleString('en-IN')}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Top hosts by revenue</p>
            {summary.data.topOrganizations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No captured orders yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Host
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary.data.topOrganizations.map((org) => (
                      <tr key={org.organizationId}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{org.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {shortId(org.organizationId)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">{formatPaise(org.revenuePaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Scanned {summary.data.scannedOrders.toLocaleString('en-IN')} orders and{' '}
            {summary.data.scannedEvents.toLocaleString('en-IN')} events for this summary.
          </p>

          {summary.data.truncated && (
            <p className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              The scan hit the per-collection limit, so these figures are a lower-bound snapshot of
              the most recent activity — not the full platform ledger.
            </p>
          )}
        </>
      )}
    </div>
  );
}

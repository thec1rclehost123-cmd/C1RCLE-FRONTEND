'use client';

import { useQuery } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { getSystemReadiness, getSystemVersion } from '@/lib/admin/admin-api';
import { formatDateTime, StatusBadge } from '@/lib/admin/format';

const CHECK_LABELS: Record<string, string> = {
  configuration: 'Configuration',
  gateway: 'Gateway',
  firestore: 'Firestore',
  storage: 'Object storage',
  redis: 'Redis',
  paymentProvider: 'Payment provider',
};

export default function HealthDesk() {
  const readiness = useQuery({
    queryKey: ['admin', 'health', 'readiness'],
    queryFn: () => getSystemReadiness(),
    refetchInterval: 30_000,
  });
  const version = useQuery({
    queryKey: ['admin', 'health', 'version'],
    queryFn: () => getSystemVersion(),
  });

  const isPending = readiness.isPending || version.isPending;
  const isError = readiness.isError || version.isError;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System health"
        description="What the gateway itself checks before reporting ready — real dependency pings, not a dashboard of invented metrics."
      />

      {isPending ? (
        <LoadingState label="Checking system status…" />
      ) : isError ? (
        <ErrorState
          description="System status could not be loaded. Please retry."
          onRetry={() => {
            void readiness.refetch();
            void version.refetch();
          }}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Dependency
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(readiness.data.checks).map(([name, status]) => (
                  <tr key={name}>
                    <td className="px-4 py-3">{CHECK_LABELS[name] ?? name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={status}
                        tone={status === 'up' ? 'success' : 'destructive'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            <p>
              Overall:{' '}
              <StatusBadge
                label={readiness.data.ok ? 'Ready' : 'Not ready'}
                tone={readiness.data.ok ? 'success' : 'destructive'}
              />
            </p>
            <p className="mt-2">Version {version.data.version} · build {version.data.buildSha}</p>
            <p>Started {formatDateTime(version.data.startedAt)}</p>
          </div>
        </>
      )}
    </div>
  );
}

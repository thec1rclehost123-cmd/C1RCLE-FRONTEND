'use client';

import { useQuery } from '@tanstack/react-query';

import { useSession } from '@c1rcle/auth';
import { ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listAdmins } from '@/lib/admin/admin-api';
import { formatDateTime, StatusBadge } from '@/lib/admin/format';

/**
 * ─── Admin settings ───────────────────────────────────────────────────────────
 * V1's `/settings` (1,525 LOC) was mostly dead code — the only thing that
 * actually did anything was password change, which already goes through
 * Better Auth's own UI, not a custom in-console form. This desk is
 * deliberately thin: it shows the signed-in admin's own profile and platform
 * role, read-only, and points at where password/account changes really
 * happen instead of re-inventing that flow.
 */
export default function SettingsDesk() {
  const { user } = useSession();

  const admins = useQuery({
    queryKey: ['admin', 'admins', 'self'],
    queryFn: () => listAdmins(100),
    enabled: user !== null,
  });

  const self = admins.data?.items.find((admin) => admin.id === user?.id) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Your admin profile. Password and account changes go through the sign-in provider, not a form here — v1's settings screen was mostly dead code once that was accounted for."
      />

      {user === null ? (
        <ErrorState description="No session." />
      ) : admins.isPending ? (
        <LoadingState label="Loading profile…" />
      ) : admins.isError ? (
        <ErrorState
          description="Your admin record could not be loaded. Please retry."
          onRetry={() => void admins.refetch()}
        />
      ) : (
        <div className="max-w-lg rounded-lg border border-border p-6">
          <dl className="flex flex-col gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Platform role
              </dt>
              <dd className="mt-1">
                {self === null ? (
                  <span className="text-muted-foreground">
                    Not a platform admin record — session role only ({user.role})
                  </span>
                ) : (
                  <StatusBadge label={self.role} tone={self.isActive ? 'success' : 'muted'} />
                )}
              </dd>
            </div>
            {self !== null ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Admin since
                </dt>
                <dd className="mt-1 text-muted-foreground">{formatDateTime(self.createdAt)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}
    </div>
  );
}

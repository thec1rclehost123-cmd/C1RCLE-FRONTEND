'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listAdmins, revokeAdmin } from '@/lib/admin/admin-api';
import { ADMIN_ROLE_LABELS, formatDateTime, shortId, StatusBadge } from '@/lib/admin/format';

import type { AdminRole } from '@/lib/admin/contract-types';

function roleTone(role: AdminRole): 'default' | 'destructive' | 'warning' | 'success' {
  switch (role) {
    case 'super':
      return 'destructive';
    case 'admin':
      return 'warning';
    case 'ops':
    case 'finance':
    case 'support':
      return 'default';
  }
}

export default function AdminsDesk() {
  const queryClient = useQueryClient();
  const [confirmingRevokeId, setConfirmingRevokeId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => listAdmins(),
  });

  const revokeMutation = useMutation({
    mutationFn: (adminId: string) => revokeAdmin(adminId),
    onSuccess: () => {
      setConfirmingRevokeId(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admins"
        description="Platform admin roster. Provisioning happens through the Proposals desk (ADMIN_PROVISION); here you can audit roles and revoke access."
      />

      {list.isPending ? (
        <LoadingState label="Loading admins…" />
      ) : list.isError ? (
        <ErrorState description="The admin roster could not be loaded. Please retry." onRetry={() => void list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No admins" description="No platform admin accounts exist yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Admin
                </th>
                <th scope="col" className="px-4 py-3">
                  Role
                </th>
                <th scope="col" className="px-4 py-3">
                  State
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
              {list.data.items.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{admin.email}</p>
                    <p className="font-mono text-xs text-muted-foreground">{shortId(admin.id)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={ADMIN_ROLE_LABELS[admin.role]} tone={roleTone(admin.role)} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={admin.isActive ? 'active' : 'revoked'}
                      tone={admin.isActive ? 'success' : 'muted'}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(admin.createdAt)}</td>
                  <td className="px-4 py-3">
                    {admin.isActive ? (
                      confirmingRevokeId === admin.id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setConfirmingRevokeId(null); }}
                          >
                            Keep
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={revokeMutation.isPending}
                            onClick={() => { revokeMutation.mutate(admin.id); }}
                          >
                            {revokeMutation.isPending ? 'Revoking…' : 'Confirm revoke'}
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setConfirmingRevokeId(admin.id); }}>
                          Revoke
                        </Button>
                      )
                    ) : (
                      <p className="text-right text-xs text-muted-foreground">—</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {revokeMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Revocation failed. It is safe to retry.
        </p>
      ) : null}
    </div>
  );
}
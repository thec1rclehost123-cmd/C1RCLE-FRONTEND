'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { ADMIN_ROLES, listAdmins, raiseProposal, revokeAdmin } from '@/lib/admin/admin-api';
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

interface RoleChange {
  readonly adminId: string;
  role: AdminRole;
}

export default function AdminsDesk() {
  const queryClient = useQueryClient();
  const [confirmingRevokeId, setConfirmingRevokeId] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<RoleChange | null>(null);
  const [roleChangeReason, setRoleChangeReason] = useState('');

  const list = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => listAdmins(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const revokeMutation = useMutation({
    mutationFn: (adminId: string) => revokeAdmin(adminId),
    onSuccess: () => {
      setConfirmingRevokeId(null);
      invalidate();
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: () => {
      if (changingRole === null) {
        throw new Error('No admin selected');
      }
      return raiseProposal({
        action: 'ADMIN_ROLE_UPDATE',
        reason: roleChangeReason.trim(),
        payload: { targetUserId: changingRole.adminId, role: changingRole.role },
      });
    },
    onSuccess: () => {
      setChangingRole(null);
      setRoleChangeReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'proposals'] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admins"
        description="Platform admin roster. Provisioning and role changes happen through the Proposals desk (Tier-3, dual control); here you can audit roles, raise a role-change proposal, and revoke access."
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
                    {!admin.isActive ? (
                      <p className="text-right text-xs text-muted-foreground">—</p>
                    ) : confirmingRevokeId === admin.id ? (
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
                    ) : changingRole?.adminId === admin.id ? (
                      <div className="flex flex-col items-end gap-2">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          New role
                          <select
                            value={changingRole.role}
                            onChange={(event) => {
                              setChangingRole({
                                adminId: admin.id,
                                role: event.target.value as AdminRole,
                              });
                            }}
                            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
                          >
                            {ADMIN_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ADMIN_ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <TextField
                          label="Reason (required)"
                          value={roleChangeReason}
                          onChange={(event) => {
                            setRoleChangeReason(event.target.value);
                          }}
                          placeholder="Why is this role changing?"
                          className="w-72"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setChangingRole(null);
                              setRoleChangeReason('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={
                              roleChangeMutation.isPending ||
                              roleChangeReason.trim() === '' ||
                              changingRole.role === admin.role
                            }
                            onClick={() => {
                              roleChangeMutation.mutate();
                            }}
                          >
                            {roleChangeMutation.isPending ? 'Raising…' : 'Raise proposal'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setChangingRole({ adminId: admin.id, role: admin.role });
                            setRoleChangeReason('');
                          }}
                        >
                          Change role
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setConfirmingRevokeId(admin.id); }}>
                          Revoke
                        </Button>
                      </div>
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
      {roleChangeMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Raising the role-change proposal failed. It is safe to retry.
        </p>
      ) : null}
      {roleChangeMutation.isSuccess ? (
        <p className="text-sm text-muted-foreground">
          Proposal raised — a second admin must approve it on the Proposals desk before the role
          change applies.
        </p>
      ) : null}
    </div>
  );
}

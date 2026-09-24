'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { banUser, exportUsersCsv, listUsers, unbanUser } from '@/lib/admin/admin-api';
import { formatEpochMs, StatusBadge } from '@/lib/admin/format';

interface Banning {
  readonly userId: string;
}

export default function UsersDesk() {
  const queryClient = useQueryClient();
  const [banning, setBanning] = useState<Banning | null>(null);
  const [reason, setReason] = useState('');

  const list = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => listUsers(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const banMutation = useMutation({
    mutationFn: () => {
      if (banning === null) {
        throw new Error('No user selected');
      }
      return banUser(banning.userId, reason.trim() === '' ? undefined : reason.trim());
    },
    onSuccess: () => {
      setBanning(null);
      setReason('');
      invalidate();
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => unbanUser(userId),
    onSuccess: invalidate,
  });

  const exportMutation = useMutation({
    mutationFn: () => exportUsersCsv(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Users"
          description="Registered platform users. Ban/unban is a Tier-2 command — a single ops/admin decision, recorded to the audit trail with the reason given."
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
        <LoadingState label="Loading users…" />
      ) : list.isError ? (
        <ErrorState
          description="Users could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No users" description="Nobody has registered yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  User
                </th>
                <th scope="col" className="px-4 py-3">
                  Role
                </th>
                <th scope="col" className="px-4 py-3">
                  Email verified
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
              {list.data.items.map((user) => {
                const isBanning = banning?.userId === user.id;
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.role ?? '—'}</td>
                    <td className="px-4 py-3">{user.emailVerified ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={user.isBanned ? 'Banned' : 'Active'}
                        tone={user.isBanned ? 'destructive' : 'success'}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatEpochMs(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {user.isBanned ? (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={unbanMutation.isPending}
                            onClick={() => {
                              unbanMutation.mutate(user.id);
                            }}
                            aria-busy={unbanMutation.isPending}
                          >
                            {unbanMutation.isPending ? 'Unbanning…' : 'Unban'}
                          </Button>
                        </div>
                      ) : isBanning ? (
                        <div className="flex flex-col items-end gap-2">
                          <TextField
                            label="Reason"
                            value={reason}
                            onChange={(event) => {
                              setReason(event.target.value);
                            }}
                            placeholder="Why is this user being banned?"
                            className="w-72"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={banMutation.isPending}
                              onClick={() => {
                                setBanning(null);
                                setReason('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={banMutation.isPending}
                              onClick={() => {
                                banMutation.mutate();
                              }}
                              aria-busy={banMutation.isPending}
                            >
                              {banMutation.isPending ? 'Banning…' : 'Confirm ban'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setBanning({ userId: user.id });
                              setReason('');
                            }}
                          >
                            Ban
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            {list.data.items.length}/{list.data.pageInfo.total} shown
          </p>
        </div>
      )}

      {banMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The user could not be banned. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}
      {unbanMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The user could not be unbanned. It is safe to retry — the request is idempotency-keyed.
        </p>
      ) : null}
      {exportMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The CSV could not be generated. Please retry.
        </p>
      ) : null}
    </div>
  );
}

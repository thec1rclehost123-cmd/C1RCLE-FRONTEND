'use client';

import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { listUsers } from '@/lib/admin/admin-api';
import { formatEpochMs } from '@/lib/admin/format';

export default function UsersDesk() {
  const list = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => listUsers(),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Registered platform users. List-only for now — impersonation or account tools are not part of the admin surface."
      />

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
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.role ?? '—'}</td>
                  <td className="px-4 py-3">{user.emailVerified ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatEpochMs(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            {list.data.items.length}/{list.data.pageInfo.total} shown
          </p>
        </div>
      )}
    </div>
  );
}

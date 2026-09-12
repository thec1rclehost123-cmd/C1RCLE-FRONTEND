'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { exportAuditCsv, listAudit } from '@/lib/admin/admin-api';
import {
  AUDIT_ACTION_LABELS,
  auditActionTone,
  formatEpochMs,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

export default function AuditDesk() {
  const [targetId, setTargetId] = useState('');

  const list = useQuery({
    queryKey: ['admin', 'audit', targetId.trim()],
    queryFn: () => listAudit(200, targetId.trim() === '' ? undefined : targetId.trim()),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportAuditCsv(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Audit trail"
          description="Immutable log of privileged actions — who changed what, against which target, with the before/after payload and reason."
        />
        <div className="flex items-end gap-2">
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void list.refetch();
            }}
          >
            <TextField
              label="Target ID"
              value={targetId}
              onChange={(event) => {
                setTargetId(event.target.value);
              }}
              placeholder="Filter by target id"
              className="w-64"
            />
            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
          </form>
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
      </div>

      {list.isPending ? (
        <LoadingState label="Loading the audit trail…" />
      ) : list.isError ? (
        <ErrorState
          description="The audit trail could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No audit records" description="Nothing matches this filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Action
                </th>
                <th scope="col" className="px-4 py-3">
                  Target
                </th>
                <th scope="col" className="px-4 py-3">
                  Admin / role
                </th>
                <th scope="col" className="px-4 py-3">
                  Reason
                </th>
                <th scope="col" className="px-4 py-3">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={AUDIT_ACTION_LABELS[record.action] ?? record.action}
                      tone={auditActionTone(record.action)}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {record.targetType}
                    <span className="text-muted-foreground/70"> / {shortId(record.targetId)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{shortId(record.adminId)}</p>
                    <p className="text-xs text-muted-foreground">{record.adminRole}</p>
                  </td>
                  <td className="max-w-md px-4 py-3 text-muted-foreground">
                    {record.reason ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatEpochMs(record.occurredAt)}
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

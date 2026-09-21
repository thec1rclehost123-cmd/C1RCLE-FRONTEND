'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Fragment, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import {
  listHosts,
  raiseCommissionAdjustProposal,
} from '@/lib/admin/admin-api';
import { formatDateTime, shortId, StatusBadge } from '@/lib/admin/format';

import type { adminHostDtoSchema } from '@c1rcle/contracts';
import type { z } from 'zod';

type AdminHost = z.infer<typeof adminHostDtoSchema>;

export default function CommissionsDesk() {
  const queryClient = useQueryClient();
  const [adjustingOrgId, setAdjustingOrgId] = useState<string | null>(null);
  const [raisedOrgId, setRaisedOrgId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'hosts', 'commissions'],
    queryFn: () => listHosts(100),
  });

  const raiseMutation = useMutation({
    mutationFn: ({ org, newRatePercent, reason }: RaiseCommissionAdjust) =>
      raiseCommissionAdjustProposal({
        organizationId: org.id,
        newRatePercent,
        reason,
      }),
    onSuccess: (_proposal, { org }) => {
      setRaisedOrgId(org.id);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'proposals'] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Commissions"
        description="Platform fee per organization, as a whole-number percent (0–100). Changing one is TIER3 dual control: raise a COMMISSION_ADJUST proposal here, a second admin approves it on the Proposals desk, and it executes from there. The rate shown is the live value from the wire."
      />

      {list.isPending ? (
        <LoadingState label="Loading organizations…" />
      ) : list.isError ? (
        <ErrorState
          description="Organizations could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No organizations" description="There are no hosts to commission yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Organization
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Members
                </th>
                <th scope="col" className="px-4 py-3">
                  Platform fee
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Adjust
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((org) => {
                const isAdjusting = adjustingOrgId === org.id;
                const isRaised = raisedOrgId === org.id;
                return (
                  <Fragment key={org.id}>
                    <tr>
                      <td className="px-4 py-3">
                        <p className="font-medium">{org.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {org.slug} · {shortId(org.id)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={org.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{org.memberCount}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold">
                          {org.platformFeePercent}%
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {defaultRateNote(org.platformFeePercent)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(org.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAdjustingOrgId(isAdjusting ? null : org.id);
                            setRaisedOrgId(null);
                          }}
                        >
                          {isAdjusting ? 'Cancel' : 'Adjust'}
                        </Button>
                      </td>
                    </tr>
                    {isAdjusting ? (
                      <tr>
                        <td colSpan={6} className="bg-muted/30 px-4 py-4">
                          {isRaised && raiseMutation.isSuccess ? (
                            <div className="flex flex-col gap-2">
                              <p className="text-sm text-foreground">
                                Proposal raised for <span className="font-medium">{org.name}</span>.
                                TIER3 dual control: a second admin must now approve and execute it
                                on the Proposals desk.
                              </p>
                              <Link
                                href="/proposals"
                                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                              >
                                Go to Proposals →
                              </Link>
                            </div>
                          ) : (
                            <CommissionAdjustForm
                              org={org}
                              pending={raiseMutation.isPending}
                              error={raiseMutation.isError}
                              onSubmit={(values) => {
                                raiseMutation.mutate({ org, ...values });
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function defaultRateNote(ratePercent: number): string {
  return ratePercent === 0 ? '(free tier)' : '(live rate, percent)';
}

interface AdjustFormValues {
  readonly newRatePercent: number;
  readonly reason: string;
}

interface RaiseCommissionAdjust extends AdjustFormValues {
  readonly org: AdminHost;
}

function CommissionAdjustForm({
  org,
  pending,
  error,
  onSubmit,
}: {
  readonly org: AdminHost;
  readonly pending: boolean;
  readonly error: boolean;
  readonly onSubmit: (values: AdjustFormValues) => void;
}) {
  const [rateText, setRateText] = useState(String(org.platformFeePercent));
  const [reason, setReason] = useState('');

  const parsedRate = Number(rateText);
  const rateValid =
    Number.isInteger(parsedRate) && parsedRate >= 0 && parsedRate <= 100;
  const reasonValid = reason.trim().length >= 1 && reason.trim().length <= 2000;
  const untouched = parsedRate === org.platformFeePercent;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!rateValid || !reasonValid) {
          return;
        }
        onSubmit({ newRatePercent: parsedRate, reason: reason.trim() });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="New platform fee (%)"
          type="number"
          min={0}
          max={100}
          step={1}
          value={rateText}
          onChange={(event) => {
            setRateText(event.target.value);
          }}
          hint="Whole-number percent, 0–100. The domain model only accepts integers."
          {...(rateText !== '' && !rateValid
            ? { error: 'Must be a whole number between 0 and 100' }
            : {})}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="commission-reason">
            Reason
          </label>
          <textarea
            id="commission-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            rows={2}
            placeholder="Business justification — locked into the audit trail with the proposal."
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          <p className="text-xs text-muted-foreground">
            {reason.length}/2000 {reasonValid ? '' : '· 1–2000 chars required'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !rateValid || !reasonValid || untouched}>
          {pending ? 'Raising proposal…' : 'Raise COMMISSION_ADJUST proposal'}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            The proposal could not be raised. Retrying is safe — commands are idempotency-keyed.
          </p>
        ) : null}
      </div>
    </form>
  );
}
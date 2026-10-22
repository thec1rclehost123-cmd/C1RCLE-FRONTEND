'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Button, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { postApprovedFinancialAdjustment, raiseProposal } from '@/lib/admin/admin-api';
import { formatPaise, shortId } from '@/lib/admin/format';

export default function AdjustmentsDesk() {
  const [organizationId, setOrganizationId] = useState('');
  const [amountPaise, setAmountPaise] = useState('');
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [reason, setReason] = useState('');
  const [approvedProposalId, setApprovedProposalId] = useState('');

  const propose = useMutation({
    mutationFn: () =>
      raiseProposal({
        action: 'FINANCIAL_ADJUSTMENT',
        reason: reason.trim(),
        payload: {
          organizationId: organizationId.trim(),
          amountPaise: Number(amountPaise),
          direction,
        },
      }),
  });
  const execute = useMutation({
    mutationFn: () => postApprovedFinancialAdjustment(approvedProposalId.trim()),
  });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Financial adjustments"
        description="Append-only corrections to partner payable. Every adjustment requires a reason, a second super-admin approval, and creates a balanced journal; historical postings are never edited."
      />

      <section className="flex flex-col gap-4 rounded-lg border border-border p-5">
        <h2 className="text-lg font-semibold">1. Propose correction</h2>
        <TextField
          label="Organization ID"
          value={organizationId}
          onChange={(e) => {
            setOrganizationId(e.target.value);
          }}
        />
        <TextField
          label="Amount in paise"
          type="number"
          value={amountPaise}
          onChange={(e) => {
            setAmountPaise(e.target.value);
          }}
        />
        <label className="flex flex-col gap-1 text-sm">
          Direction
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value as 'credit' | 'debit');
            }}
          >
            <option value="credit">Increase partner payable</option>
            <option value="debit">Decrease partner payable</option>
          </select>
        </label>
        <TextField
          label="Reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
          }}
        />
        <Button
          disabled={
            propose.isPending ||
            !organizationId.trim() ||
            !reason.trim() ||
            !Number.isSafeInteger(Number(amountPaise)) ||
            Number(amountPaise) <= 0
          }
          onClick={() => {
            propose.mutate();
          }}
        >
          {propose.isPending ? 'Raising…' : 'Raise dual-control proposal'}
        </Button>
        {propose.data ? (
          <p className="text-sm text-muted-foreground">
            Proposal {shortId(propose.data.id)} raised. A different super admin must approve it on{' '}
            <Link className="underline" href="/proposals">
              Proposals
            </Link>
            .
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-5">
        <h2 className="text-lg font-semibold">2. Post approved proposal</h2>
        <TextField
          label="Approved proposal ID"
          value={approvedProposalId}
          onChange={(e) => {
            setApprovedProposalId(e.target.value);
          }}
        />
        <Button
          disabled={execute.isPending || !approvedProposalId.trim()}
          onClick={() => {
            execute.mutate();
          }}
        >
          {execute.isPending ? 'Posting…' : 'Post adjustment journal'}
        </Button>
        {execute.data ? (
          <p className="text-sm text-muted-foreground">
            Posted {formatPaise(execute.data.amountPaise)} {execute.data.direction} adjustment in
            journal {shortId(execute.data.journalId)}.
          </p>
        ) : null}
      </section>

      {propose.isError || execute.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The adjustment was not posted. Check approval, authority, and evidence, then retry safely.
        </p>
      ) : null}
    </div>
  );
}

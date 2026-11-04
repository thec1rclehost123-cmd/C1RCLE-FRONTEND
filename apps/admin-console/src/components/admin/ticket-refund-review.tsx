'use client';

import { useRef, useState } from 'react';

import { requestRefund } from '@/lib/admin/admin-api';

export function AdminTicketRefundReview({
  orderId,
  ticketIds,
  reason,
}: {
  readonly orderId: string;
  readonly ticketIds: readonly string[];
  readonly reason: string;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intent = useRef<{ amount: string; key: string } | null>(null);
  async function create() {
    if (busy || !/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) return;
    setBusy(true);
    setError(null);
    const key = intent.current?.amount === amount ? intent.current.key : crypto.randomUUID();
    intent.current = { amount, key };
    try {
      await requestRefund(
        {
          orderId,
          amountPaise: Math.round(Number(amount) * 100),
          reason,
          targetEntitlementIds: ticketIds,
        },
        key,
      );
      setNotice('Financial refund request created. Approval and execution remain separate.');
    } catch {
      setError(
        'The financial request could not be created. Check your permission, selected tickets and remaining refundable balance.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (notice)
    return (
      <p role="status" className="mt-3 text-sm">
        {notice}
      </p>
    );
  return (
    <div className="mt-3">
      <label className="grid gap-1 text-sm">
        Refund amount (₹)
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
          }}
          className="rounded border border-input bg-background p-2"
        />
      </label>
      <button
        type="button"
        disabled={busy || !amount}
        onClick={() => {
          void create();
        }}
        className="mt-2 rounded border border-input px-3 py-2 text-sm disabled:opacity-50"
      >
        {busy ? 'Creating…' : 'Create financial refund request'}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSession } from '@c1rcle/auth';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import {
  acceptTicketTransferResponseSchema,
  declineTicketTransferResponseSchema,
} from '../transfer-api';

export function TicketTransferClaimClient({ transferId }: { transferId: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [resolved, setResolved] = useState<'accepted' | 'declined' | null>(null);

  async function accept() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await bffClient.post({
        path: `/api/ticket-transfers/${encodeURIComponent(transferId)}/accept`,
        body: {},
        headers: csrfHeaders(),
        schema: acceptTicketTransferResponseSchema,
      });
      setResolved('accepted');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await bffClient.post({
        path: `/api/ticket-transfers/${encodeURIComponent(transferId)}/decline`,
        body: {},
        headers: csrfHeaders(),
        schema: declineTicketTransferResponseSchema,
      });
      setResolved('declined');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <p role="status" className="text-sm text-white/60">
        Checking your sign-in…
      </p>
    );
  }

  if (!isAuthenticated) {
    const next = `/ticket-transfer/${encodeURIComponent(transferId)}`;
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-white/65">
          Sign in with the verified email address this ticket was sent to, then reopen this
          invitation.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="inline-flex min-h-11 items-center rounded-full bg-white px-6 text-xs font-black uppercase tracking-wider text-black"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  if (resolved === 'accepted') {
    return (
      <div role="status" className="space-y-4">
        <p className="text-sm leading-6 text-white/65">
          Ticket accepted. The previous entry code has been replaced.
        </p>
        <button
          type="button"
          onClick={() => {
            router.replace('/tickets');
          }}
          className="min-h-11 rounded-full bg-white px-6 text-xs font-black uppercase tracking-wider text-black"
        >
          View my tickets
        </button>
      </div>
    );
  }

  if (resolved === 'declined') {
    return (
      <p role="status" className="text-sm leading-6 text-white/65">
        Invitation declined. The ticket stays with its current holder.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-white/65">
        Accepting moves the ticket to your account and replaces the sender’s entry code. Your
        account must have the invited verified email.
      </p>
      <button
        type="button"
        onClick={() => void accept()}
        disabled={busy}
        className="min-h-11 rounded-full bg-white px-6 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
      >
        {busy ? 'Accepting…' : 'Accept ticket'}
      </button>
      <button
        type="button"
        onClick={() => void decline()}
        disabled={busy}
        className="ml-3 min-h-11 rounded-full border border-white/25 px-6 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
      >
        {busy ? 'Updating…' : 'Decline invitation'}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          This invitation is unavailable or does not match your verified account.
        </p>
      ) : null}
    </div>
  );
}

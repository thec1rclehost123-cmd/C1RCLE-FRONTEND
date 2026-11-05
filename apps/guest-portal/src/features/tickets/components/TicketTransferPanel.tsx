'use client';

import { useRef, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import {
  cancelTicketTransferResponseSchema,
  createTicketTransferResponseSchema,
  resendTicketTransferResponseSchema,
} from '../transfer-api';

import type { ManagedTicket } from '@c1rcle/contracts';

const primary =
  'min-h-11 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40';
const secondary =
  'min-h-11 rounded-full border border-white/20 px-5 text-sm text-white/80 hover:bg-white/5 disabled:opacity-40';

export function TicketTransferPanel({
  management,
  onBack,
  onChanged,
}: {
  management: ManagedTicket;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [stage, setStage] = useState<'email' | 'review' | 'cancel'>('email');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(management.pendingTransfer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestKey = useRef<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const failure = (caught: unknown) =>
    isApiClientError(caught)
      ? caught.message
      : 'This action could not be completed. Please try again.';

  async function create() {
    if (busy || !management.canTransfer) return;
    setBusy(true);
    setError(null);
    requestKey.current ??= crypto.randomUUID();
    try {
      const invitation = await bffClient.post({
        path: `/api/tickets/${encodeURIComponent(management.id)}/transfers`,
        body: { recipientEmail: email.trim() },
        headers: { ...csrfHeaders(), 'idempotency-key': requestKey.current },
        schema: createTicketTransferResponseSchema,
      });
      if (invitation.status !== 'pending') {
        setError('This invitation is no longer pending. Refresh ticket details.');
        return;
      }
      setPending(invitation);
      setSubmittedEmail(email.trim());
      requestKey.current = null;
      onChanged();
    } catch (caught) {
      setError(failure(caught));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await bffClient.post({
        path: `/api/ticket-transfers/${encodeURIComponent(pending.id)}/cancel`,
        body: {},
        headers: csrfHeaders(),
        schema: cancelTicketTransferResponseSchema,
      });
      if (result.transfer.status !== 'cancelled') {
        setError(`This invitation is ${result.transfer.status}. Refresh ticket details.`);
        return;
      }
      setPending(null);
      setStage('email');
      setNotice('Invitation cancelled. The ticket has not changed holders.');
      onChanged();
    } catch (caught) {
      setError(failure(caught));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    requestKey.current ??= crypto.randomUUID();
    try {
      await bffClient.post({
        path: `/api/ticket-transfers/${encodeURIComponent(pending.id)}/resend`,
        body: {},
        headers: { ...csrfHeaders(), 'idempotency-key': requestKey.current },
        schema: resendTicketTransferResponseSchema,
      });
      requestKey.current = null;
      setNotice(
        'Resend requested. Email delivery is not confirmed. You can also share the invitation link.',
      );
    } catch (caught) {
      setError(failure(caught));
    } finally {
      setBusy(false);
    }
  }

  const url = pending
    ? `${window.location.origin}/ticket-transfer/${encodeURIComponent(pending.id)}`
    : null;
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        className="min-h-10 text-sm text-white/60 hover:text-white disabled:opacity-40"
      >
        ← Ticket details
      </button>
      <div className="border-b border-white/10 pb-4">
        <p className="text-base font-semibold text-white">{management.tierName}</p>
        <p className="mt-1 text-sm text-white/55">
          {management.ownership === 'unassigned'
            ? 'Unassigned ticket'
            : `Current holder: ${management.holderName ?? 'Guest'}`}
        </p>
      </div>
      {pending ? (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {stage === 'cancel'
                ? 'Cancel this invitation?'
                : pending.status === 'frozen'
                  ? 'Transfer on hold'
                  : 'Waiting for acceptance'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {pending.status === 'frozen'
                ? 'Contact support before making another transfer.'
                : 'The ticket stays with its current holder until the invited recipient accepts.'}
            </p>
            {submittedEmail ? (
              <p className="mt-3 break-all text-sm text-white">{submittedEmail}</p>
            ) : null}
            <p className="mt-2 text-xs text-white/50">
              Expires{' '}
              {new Date(pending.expiresAt).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              IST
            </p>
          </div>
          {pending.status === 'pending' && management.ownership !== 'transferred' ? (
            stage === 'cancel' ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondary}
                  disabled={busy}
                  onClick={() => {
                    setStage('email');
                  }}
                >
                  Keep invitation
                </button>
                <button
                  type="button"
                  className={primary}
                  disabled={busy}
                  onClick={() => void cancel()}
                >
                  {busy ? 'Cancelling…' : 'Cancel invitation'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs leading-5 text-white/50">
                  Email delivery is not confirmed. Only the invited verified email can claim this
                  link.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={primary}
                    onClick={() => {
                      if (url)
                        void navigator.clipboard.writeText(url).then(
                          () => {
                            setNotice('Invitation link copied.');
                          },
                          () => {
                            setError('Copy is unavailable. Use the invitation link below.');
                          },
                        );
                    }}
                  >
                    Copy invitation link
                  </button>
                  <button
                    type="button"
                    className={secondary}
                    disabled={busy}
                    onClick={() => void resend()}
                  >
                    {busy ? 'Requesting…' : 'Resend invitation'}
                  </button>
                </div>
                <a
                  href={url ?? undefined}
                  className="block text-sm text-white/60 underline underline-offset-4"
                >
                  Open invitation
                </a>
                <button
                  type="button"
                  className="min-h-11 text-sm text-white/55 underline underline-offset-4"
                  disabled={busy}
                  onClick={() => {
                    setStage('cancel');
                  }}
                >
                  Cancel pending transfer
                </button>
              </>
            )
          ) : null}
        </div>
      ) : !management.canTransfer ? (
        <p role="status" className="text-sm leading-6 text-white/65">
          {management.transferUnavailableReason ?? 'This ticket cannot be transferred.'}
        </p>
      ) : stage === 'review' ? (
        <div className="space-y-5">
          <h3 className="text-xl font-semibold text-white">Review invitation</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-white/50">Ticket</dt>
              <dd className="mt-1 text-white">{management.tierName} ×1</dd>
            </div>
            <div>
              <dt className="text-white/50">Recipient email</dt>
              <dd className="mt-1 break-all text-white">{email.trim()}</dd>
            </div>
          </dl>
          <p className="text-sm leading-6 text-white/60">
            They must sign in with this verified email. Ownership changes only when they accept, and
            the previous entry code is then replaced.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={secondary}
              disabled={busy}
              onClick={() => {
                setStage('email');
                setError(null);
              }}
            >
              Edit email
            </button>
            <button type="button" className={primary} disabled={busy} onClick={() => void create()}>
              {busy ? 'Creating invitation…' : 'Create transfer link'}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setStage('review');
          }}
        >
          <div>
            <h3 className="text-xl font-semibold text-white">
              {management.ownership === 'unassigned' ? 'Invite an attendee' : 'Transfer ticket'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Choose who will receive this individual ticket.
            </p>
          </div>
          <label className="block text-sm text-white/65" htmlFor="ticket-transfer-email">
            Recipient email
            <input
              id="ticket-transfer-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                requestKey.current = null;
              }}
              className="mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-black px-4 text-base text-white focus-visible:outline-2 focus-visible:outline-white"
              placeholder="name@example.com"
            />
          </label>
          <button type="submit" className={primary}>
            Review invitation
          </button>
        </form>
      )}
      {notice ? (
        <p role="status" className="text-sm leading-5 text-white/65">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm leading-5 text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

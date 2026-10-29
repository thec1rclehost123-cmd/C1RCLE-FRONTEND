'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

import { magicQrResponseSchema } from '@c1rcle/contracts';
import { Dialog } from '@c1rcle/ui';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import {
  cancelTicketTransferResponseSchema,
  createTicketTransferResponseSchema,
  resendTicketTransferResponseSchema,
  ticketTransferListResponseSchema,
  type TicketTransferItem,
} from '../transfer-api';

import type { UserTicketItem } from '../types/tickets.types';
import type { MagicQrResponse } from '@c1rcle/contracts';

export interface TicketDetailModalProps {
  ticket: UserTicketItem | null;
  onClose: () => void;
}

const STATUS_COPY = {
  active: {
    label: 'Active',
    detail: 'Booking confirmed.',
  },
  used: { label: 'Used', detail: 'This ticket has already been used.' },
  cancelled: { label: 'Cancelled', detail: 'This ticket is no longer valid.' },
  pending: { label: 'Pending', detail: 'This ticket is still being confirmed.' },
  refund_pending: {
    label: 'Refund processing',
    detail: 'A refund is being processed. This ticket cannot be used.',
  },
  refunded: {
    label: 'Refunded',
    detail: 'This ticket was refunded and is no longer valid.',
  },
  unavailable: { label: 'Unavailable', detail: 'Current event details could not be loaded.' },
} as const;

const coverMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

type EntryCodeState =
  { phase: 'loading' } | { phase: 'ready'; code: MagicQrResponse } | { phase: 'failed' };

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const status = ticket ? STATUS_COPY[ticket.status] : null;
  const ticketId = ticket?.status === 'active' ? ticket.id : null;
  const isUnassignedCustody = ticket?.custody === 'unassigned';
  const [stored, setStored] = useState<{ ticketId: string | null; state: EntryCodeState }>({
    ticketId: null,
    state: { phase: 'loading' },
  });
  const [attempt, setAttempt] = useState(0);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferCancelled, setTransferCancelled] = useState(false);
  const [transferLinkMessage, setTransferLinkMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const resendIdempotencyKey = useRef<{ transferId: string; value: string } | null>(null);
  const [transfers, setTransfers] = useState<TicketTransferItem[]>([]);
  const [transferListAttempt, setTransferListAttempt] = useState(0);
  const [transferListResultKey, setTransferListResultKey] = useState<string | null>(null);
  const [transferListState, setTransferListState] = useState<'ready' | 'failed'>('ready');
  const entryCode: EntryCodeState =
    ticketId && stored.ticketId === ticketId ? stored.state : { phase: 'loading' };
  const transferListRequestKey = ticketId ? `${ticketId}:${String(transferListAttempt)}` : null;
  const transferHistoryLoading =
    transferListRequestKey !== null && transferListResultKey !== transferListRequestKey;
  const ticketTransfers =
    transferListResultKey === transferListRequestKey && Array.isArray(transfers) ? transfers : [];
  const pendingTransfer = ticketTransfers.find((transfer) => transfer.status === 'pending') ?? null;
  const pendingTransferUrl = pendingTransfer
    ? `${window.location.origin}/ticket-transfer/${encodeURIComponent(pendingTransfer.id)}`
    : null;

  async function copyTransferLink() {
    if (!pendingTransferUrl) return;
    try {
      await navigator.clipboard.writeText(pendingTransferUrl);
      setTransferLinkMessage('Invitation link copied. Share it with the invited email recipient.');
    } catch {
      setTransferLinkMessage(
        'Copy is unavailable here. Use the invitation link above to share it.',
      );
    }
  }

  async function createTransfer(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticketId || transferBusy) return;
    setTransferBusy(true);
    setTransferError(null);
    setTransferCancelled(false);
    try {
      const transfer = await bffClient.post({
        path: `/api/tickets/${encodeURIComponent(ticketId)}/transfers`,
        body: { recipientEmail },
        headers: csrfHeaders(),
        schema: createTicketTransferResponseSchema,
      });
      setTransfers((current) => [...current, transfer]);
      setRecipientEmail('');
    } catch {
      setTransferError(
        'This ticket could not be transferred. It may be unavailable or restricted.',
      );
    } finally {
      setTransferBusy(false);
    }
  }

  async function cancelTransfer(id: string) {
    if (!id || transferBusy) return;
    setTransferBusy(true);
    setTransferError(null);
    try {
      const result = await bffClient.post({
        path: `/api/ticket-transfers/${encodeURIComponent(id)}/cancel`,
        body: {},
        headers: csrfHeaders(),
        schema: cancelTicketTransferResponseSchema,
      });
      setTransfers((current) =>
        current.map((transfer) =>
          transfer.id === id ? { ...transfer, status: result.transfer.status } : transfer,
        ),
      );
      setTransferCancelled(true);
    } catch {
      setTransferError('This transfer could not be cancelled. It may have already been claimed.');
    } finally {
      setTransferBusy(false);
    }
  }

  async function resendTransfer(id: string) {
    if (!id || transferBusy) return;
    if (resendIdempotencyKey.current?.transferId !== id) {
      resendIdempotencyKey.current = { transferId: id, value: crypto.randomUUID() };
    }
    setTransferBusy(true);
    setTransferError(null);
    setResendMessage(null);
    try {
      await bffClient.post({
        path: `/api/ticket-transfers/${encodeURIComponent(id)}/resend`,
        body: {},
        headers: {
          ...csrfHeaders(),
          'idempotency-key': resendIdempotencyKey.current.value,
        },
        schema: resendTicketTransferResponseSchema,
      });
      resendIdempotencyKey.current = null;
      setResendMessage(
        'Resend requested. Email delivery is not confirmed; use the secure link below if needed.',
      );
    } catch {
      setTransferError(
        'The invitation could not be resent. You can still share the secure link below.',
      );
    } finally {
      setTransferBusy(false);
    }
  }

  useEffect(() => {
    if (!ticketId || isUnassignedCustody) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const code = await bffClient.get({
          path: `/api/tickets/${encodeURIComponent(ticketId)}/qr`,
          schema: magicQrResponseSchema,
        });
        if (cancelled) return;
        setStored({ ticketId, state: { phase: 'ready', code } });
        timer = setTimeout(() => void load(), Math.max(code.refreshIntervalSec, 1) * 1000);
      } catch {
        if (!cancelled) setStored({ ticketId, state: { phase: 'failed' } });
      }
    };
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ticketId, attempt, isUnassignedCustody]);

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    const requestKey = `${ticketId}:${String(transferListAttempt)}`;
    void bffClient
      .get({
        path: `/api/tickets/${encodeURIComponent(ticketId)}/transfers`,
        schema: ticketTransferListResponseSchema,
      })
      .then((items) => {
        if (cancelled) return;
        setTransfers(items);
        setTransferListResultKey(requestKey);
        setTransferListState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setTransferListResultKey(requestKey);
        setTransferListState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId, transferListAttempt]);

  return (
    <Dialog
      open={ticket !== null}
      onClose={onClose}
      title={ticket?.eventTitle ?? 'Ticket details'}
      description="Your pass details."
      className="border-white/15 bg-[#0a0a0a] text-white shadow-[0_32px_120px_rgba(0,0,0,0.75)]"
    >
      {ticket && status ? (
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF6842]">
                {ticket.tierName}
              </p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
                {status.label}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/65">{status.detail}</p>
          </div>

          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail
              label="Date and time"
              value={[ticket.date, ticket.time].filter(Boolean).join(' · ') || 'Unavailable'}
            />
            <Detail
              label="Venue"
              value={
                [ticket.venueName, ticket.city]
                  .map((part) => part.trim())
                  .filter(Boolean)
                  .join(', ') || 'Unavailable'
              }
            />
            <Detail label="Ticket holder" value={ticket.holderName} />
            <Detail label="Quantity" value={String(ticket.ticketCount)} />
            {ticket.bookingReference ? (
              <Detail label="Booking reference" value={ticket.bookingReference} />
            ) : null}
          </dl>

          {ticket.ticketAddons?.length ? (
            <section
              aria-label="Ticket extras"
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white/75">
                Ticket extras
              </h3>
              <ul className="mt-3 space-y-2">
                {ticket.ticketAddons.map((addon) => (
                  <li key={addon.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/75">{addon.name}</span>
                    <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/55">
                      {addon.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {ticket.status === 'active' && !isUnassignedCustody ? (
            <Link
              href={`/checkout/${encodeURIComponent(ticket.eventId)}?upgradeFromEntitlementId=${encodeURIComponent(ticket.id)}`}
              className="flex min-h-11 items-center justify-center rounded-full border border-[#FF6842]/45 bg-[#FF6842]/10 px-5 text-xs font-bold uppercase tracking-wider text-[#FFB29C] transition-colors hover:bg-[#FF6842]/20"
            >
              Upgrade ticket
            </Link>
          ) : null}

          {ticket.eventCover ? (
            <section
              aria-label="Event cover wallet"
              className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white/75">
                  Event cover
                </h3>
                <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/55">
                  {ticket.eventCover.status.replace('_', ' ')}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <Detail
                  label="Remaining"
                  value={coverMoney.format(ticket.eventCover.remainingPaise / 100)}
                />
                <Detail
                  label="Issued"
                  value={coverMoney.format(ticket.eventCover.issuedPaise / 100)}
                />
                <Detail
                  label="Reserved"
                  value={coverMoney.format(ticket.eventCover.reservedPaise / 100)}
                />
                <Detail
                  label="Redeemed"
                  value={coverMoney.format(ticket.eventCover.redeemedPaise / 100)}
                />
              </dl>
              <p className="text-[11px] leading-5 text-white/45">
                This balance belongs to this ticket and is separate from admission.
              </p>
              {ticket.eventCover.history.length > 0 ? (
                <ol className="space-y-2 border-t border-white/10 pt-3 text-[11px] text-white/55">
                  {ticket.eventCover.history.map((entry, index) => (
                    <li
                      key={`${entry.type}-${entry.createdAt}-${String(index)}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>
                        {entry.type.replace('_', ' ')} ·{' '}
                        {new Date(entry.createdAt).toLocaleDateString('en-IN')}
                      </span>
                      <span>{coverMoney.format(entry.amountPaise / 100)}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>
          ) : null}

          {ticketId && isUnassignedCustody ? (
            <p
              role="status"
              className="border-t border-white/10 pt-5 text-sm leading-6 text-white/65"
            >
              This ticket is unassigned and cannot be used yet. Invite an attendee with their
              verified email to let them claim it and receive their own entry code.
            </p>
          ) : null}

          {ticketId && !isUnassignedCustody ? (
            <div className="flex flex-col items-center gap-3 border-t border-white/10 pt-5 text-center">
              {entryCode.phase === 'ready' ? (
                <>
                  <div className="rounded-2xl bg-white p-4">
                    <QRCodeSVG
                      value={entryCode.code.qrPayload}
                      size={220}
                      level="M"
                      marginSize={2}
                      title={`Entry code for ${ticket.eventTitle}`}
                      role="img"
                      aria-label={`Entry code for ${ticket.eventTitle}`}
                    />
                  </div>
                  <p className="text-xs text-white/45">
                    Refreshes every {entryCode.code.refreshIntervalSec}s · scan at the door
                  </p>
                </>
              ) : entryCode.phase === 'failed' ? (
                <>
                  <p className="text-sm text-white/65">Entry code unavailable.</p>
                  <button
                    type="button"
                    className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold"
                    onClick={() => {
                      setStored({ ticketId: null, state: { phase: 'loading' } });
                      setAttempt((current) => current + 1);
                    }}
                  >
                    Try again
                  </button>
                </>
              ) : (
                <p className="text-sm text-white/65">Fetching entry code…</p>
              )}
            </div>
          ) : null}

          {transferHistoryLoading ? (
            <p className="border-t border-white/10 pt-5 text-xs text-white/50">
              Checking transfer status…
            </p>
          ) : null}
          {ticketId && !transferHistoryLoading && transferListState === 'failed' ? (
            <p role="status" className="border-t border-white/10 pt-5 text-xs text-white/60">
              Transfer status is unavailable. Try again before creating another transfer.
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => {
                  setTransferListAttempt((current) => current + 1);
                }}
              >
                Retry
              </button>
            </p>
          ) : null}
          {ticketId &&
          !transferHistoryLoading &&
          transferListState === 'ready' &&
          pendingTransfer ? (
            <div className="space-y-3 border-t border-white/10 pt-5">
              <div>
                <h3 className="text-sm font-bold text-white">Transfer pending</h3>
                <p className="mt-1 text-xs leading-5 text-white/50">
                  The recipient must sign in with the invited verified email. Your ticket remains
                  yours until they accept.
                </p>
                <p className="mt-1 text-xs leading-5 text-white/50">
                  Email delivery cannot be confirmed here. Share this secure link with the invited
                  verified email recipient.
                </p>
              </div>
              <a
                href={pendingTransferUrl ?? undefined}
                className="block break-all text-xs text-[#FF9B7F] underline"
              >
                Reopen or share the invitation link
              </a>
              <button
                type="button"
                disabled={transferBusy}
                onClick={() => void resendTransfer(pendingTransfer.id)}
                className="min-h-11 rounded-full border border-white/20 px-5 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {transferBusy ? 'Requesting…' : 'Resend invitation'}
              </button>
              {resendMessage ? (
                <p role="status" className="text-xs text-white/65">
                  {resendMessage}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void copyTransferLink()}
                className="min-h-11 rounded-full border border-white/20 px-5 text-xs font-bold uppercase tracking-wider"
              >
                Copy invitation link
              </button>
              {transferLinkMessage ? (
                <p role="status" className="text-xs text-white/65">
                  {transferLinkMessage}
                </p>
              ) : null}
              <button
                type="button"
                disabled={transferBusy}
                onClick={() => {
                  void cancelTransfer(pendingTransfer.id);
                }}
                className="min-h-11 rounded-full border border-white/20 px-5 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {transferBusy ? 'Updating…' : 'Cancel pending transfer'}
              </button>
              {transferError ? (
                <p role="alert" className="text-xs text-rose-300">
                  {transferError}
                </p>
              ) : null}
            </div>
          ) : null}
          {ticketId &&
          !transferHistoryLoading &&
          transferListState === 'ready' &&
          !pendingTransfer ? (
            <form
              onSubmit={(event) => {
                void createTransfer(event);
              }}
              className="space-y-3 border-t border-white/10 pt-5"
            >
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isUnassignedCustody
                    ? 'Invite an attendee to claim this ticket'
                    : 'Transfer this ticket'}
                </h3>
                <p className="mt-1 text-xs leading-5 text-white/50">
                  {isUnassignedCustody
                    ? 'The recipient must sign in with this verified email to claim this ticket and receive their own entry code.'
                    : 'The recipient must sign in with this verified email to accept. This permanently moves the ticket and replaces its entry code.'}
                </p>
              </div>
              <label htmlFor="ticket-transfer-email" className="sr-only">
                Recipient email
              </label>
              <input
                id="ticket-transfer-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={recipientEmail}
                onChange={(event) => {
                  setRecipientEmail(event.target.value);
                }}
                className="min-h-11 w-full rounded-xl border border-white/15 bg-black px-3 text-sm text-white"
                placeholder="Recipient email"
              />
              <button
                type="submit"
                disabled={transferBusy}
                className="min-h-11 rounded-full border border-white/20 px-5 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {transferBusy ? 'Creating link…' : 'Create transfer link'}
              </button>
              {transferCancelled ? (
                <p role="status" className="text-xs text-white/65">
                  The pending transfer was cancelled. Your ticket remains with you.
                </p>
              ) : null}
              {transferError ? (
                <p role="alert" className="text-xs text-rose-300">
                  {transferError}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">{label}</dt>
      <dd className="mt-1 font-semibold text-white">{value}</dd>
    </div>
  );
}

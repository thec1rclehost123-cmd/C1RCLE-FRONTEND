'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { managedTicketSchema, magicQrResponseSchema } from '@c1rcle/contracts';
import { Dialog } from '@c1rcle/ui';

import { bffClient } from '@/lib/bff/bff-client';

import { formatEventTitle } from '../ticket-presentation';

import { GuestRefundRequest } from './GuestRefundRequest';
import { RsvpCancellation } from './RsvpCancellation';
import { TicketTransferPanel } from './TicketTransferPanel';

import type { UserTicketItem } from '../types/tickets.types';
import type { ManagedTicket, MagicQrResponse } from '@c1rcle/contracts';

export type TicketModalView = 'booking' | 'details' | 'qr';
export interface TicketDetailModalProps {
  ticket: UserTicketItem | null;
  bookingTickets?: readonly UserTicketItem[] | undefined;
  onSelectTicket?: ((ticket: UserTicketItem) => void) | undefined;
  initialView?: TicketModalView;
  onClose: () => void;
  onOwnershipChanged?: (() => void) | undefined;
}
const STATUS_COPY = {
  processing: {
    label: 'Processing',
    detail:
      'Payment received. Admission and QR access are unavailable until booking fulfillment completes.',
  },
  active: { label: 'Active', detail: 'Booking confirmed.' },
  postponed: {
    label: 'Postponed',
    detail: 'New date to be announced. Your ticket is preserved; admission is on hold.',
  },
  used: { label: 'Used', detail: 'This ticket has already been used.' },
  cancelled: { label: 'Cancelled', detail: 'This ticket is no longer valid.' },
  pending: { label: 'Pending', detail: 'This ticket is still being confirmed.' },
  refund_pending: {
    label: 'Refund processing',
    detail: 'A refund is being processed. This ticket cannot be used.',
  },
  refunded: { label: 'Refunded', detail: 'This ticket was refunded and is no longer valid.' },
  unavailable: { label: 'Unavailable', detail: 'Current event details could not be loaded.' },
} as const;
const coverMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const action =
  'inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-40';

export function TicketDetailModal(props: TicketDetailModalProps) {
  return (
    <TicketDetailContent
      key={`${props.ticket?.id ?? 'closed'}:${props.initialView ?? 'details'}`}
      {...props}
    />
  );
}

function TicketDetailContent({
  ticket,
  bookingTickets,
  onSelectTicket,
  initialView = 'details',
  onClose,
  onOwnershipChanged,
}: TicketDetailModalProps) {
  const ticketId = ticket?.id;
  const [view, setView] = useState<TicketModalView | 'transfer'>(initialView);
  const [management, setManagement] = useState<ManagedTicket | null>(ticket?.management ?? null);
  const [readState, setReadState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    void bffClient
      .get({
        path: `/api/tickets/${encodeURIComponent(ticketId)}/management`,
        schema: managedTicketSchema,
        retries: 0,
        timeoutMs: 15000,
      })
      .then((data) => {
        if (!cancelled) {
          setManagement(data);
          setReadState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setReadState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId, attempt]);
  const close = useCallback(() => {
    onClose();
    if (changed) onOwnershipChanged?.();
  }, [onClose, onOwnershipChanged, changed]);
  const owner =
    management?.ownership === 'you'
      ? `You · ${management.holderName ?? ticket?.holderName ?? 'Guest'}`
      : management?.ownership === 'unassigned' || ticket?.custody === 'unassigned'
        ? 'Unassigned'
        : (management?.holderName ?? ticket?.holderName ?? 'Guest');
  const canPresent = readState === 'ready' && management?.canPresent === true;
  const status = ticket
    ? STATUS_COPY[
        management?.eventStatus === 'postponed' && management.status === 'active'
          ? 'postponed'
          : (management?.status ?? ticket.status)
      ]
    : null;
  const holderChanged = management?.ownership === 'transferred';
  if (typeof document === 'undefined') return null;
  return createPortal(
    <Dialog
      open={ticket !== null}
      onClose={close}
      title={
        view === 'transfer'
          ? 'Ticket transfer'
          : view === 'qr'
            ? 'Entry code'
            : ticket
              ? formatEventTitle(ticket.eventTitle)
              : 'Ticket details'
      }
      className="max-h-[calc(100dvh-2rem)] max-w-xl rounded-2xl border-white/15 bg-[#0a0a0a] p-5 text-white shadow-2xl sm:p-7"
    >
      {ticket && status ? (
        view === 'transfer' && management ? (
          <TicketTransferPanel
            key={management.id}
            management={management}
            onBack={() => {
              setView('details');
            }}
            onChanged={() => {
              setChanged(true);
              setAttempt((value) => value + 1);
            }}
          />
        ) : view === 'qr' ? (
          <div className="space-y-5">
            <button
              type="button"
              className="min-h-10 text-sm text-white/60 hover:text-white"
              onClick={() => {
                setView('details');
              }}
            >
              ← Ticket details
            </button>
            <p className="text-sm text-white/70">
              {ticket.tierName} · {owner}
            </p>
            {canPresent ? (
              <EntryCode ticket={ticket} />
            ) : (
              <p role="status" className="text-sm text-white/65">
                {management?.qrUnavailableReason ??
                  'Entry code unavailable. Refresh ticket details.'}
              </p>
            )}
          </div>
        ) : view === 'booking' && bookingTickets ? (
          <div className="space-y-4">
            <p className="text-sm text-white/55">
              {bookingTickets.length} individual{' '}
              {bookingTickets.length === 1 ? 'ticket' : 'tickets'} in this booking
            </p>
            <ul className="divide-y divide-white/10">
              {bookingTickets.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTicket?.(item);
                      setView('details');
                    }}
                    className="flex min-h-20 w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {item.tierName} · Ticket {index + 1}
                      </span>
                      <span className="mt-1 block text-xs text-white/55">
                        {item.management?.ownership === 'you'
                          ? 'You'
                          : item.custody === 'unassigned'
                            ? 'Unassigned'
                            : item.holderName}
                        {item.management?.pendingTransfer ? ' · Invitation pending' : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-white/60">
                      {item.management?.ownership === 'transferred'
                        ? 'Transferred'
                        : item.status.replace('_', ' ')}{' '}
                      <span aria-hidden="true">→</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-5">
            {bookingTickets && bookingTickets.length > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setView('booking');
                }}
                className="min-h-10 text-sm text-white/60 hover:text-white"
              >
                ← All tickets in booking
              </button>
            ) : null}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-base font-semibold">{ticket.tierName}</p>
                <p className="mt-1 text-xs text-white/50">
                  {holderChanged
                    ? 'Held by another attendee'
                    : ticket.custody === 'unassigned'
                      ? 'Waiting for an attendee to claim it'
                      : status.detail}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs ${status.label === 'Active' && !holderChanged && ticket.custody !== 'unassigned' ? 'text-emerald-400' : 'text-white/60'}`}
              >
                {holderChanged
                  ? 'Transferred'
                  : ticket.custody === 'unassigned'
                    ? 'Unassigned'
                    : status.label}
              </span>
            </div>
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <Detail
                label="Date and time"
                value={
                  management?.eventStatus === 'postponed'
                    ? 'New date to be announced'
                    : [ticket.date, ticket.time].filter(Boolean).join(' · ') || 'Unavailable'
                }
              />
              <Detail
                label="Venue"
                value={[ticket.venueName, ticket.city].filter(Boolean).join(', ') || 'Unavailable'}
              />
              <Detail label="Current holder" value={owner} />
              {ticket.ticketCount > 1 ? (
                <Detail label="Quantity" value={String(ticket.ticketCount)} />
              ) : null}
            </dl>
            {ticket.custody === 'unassigned' ? (
              <p role="status" className="text-sm leading-6 text-white/60">
                This ticket is unassigned and cannot be used yet. Invite an attendee to claim it.
              </p>
            ) : null}
            {readState === 'ready' && !canPresent && management?.qrUnavailableReason ? (
              <p role="status" className="text-sm text-white/65">
                {management.qrUnavailableReason}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
              {canPresent ? (
                <button
                  type="button"
                  onClick={() => {
                    setView('qr');
                  }}
                  className={`${action} bg-white text-black hover:bg-white/90`}
                >
                  Show entry code
                </button>
              ) : null}
              {management &&
              readState === 'ready' &&
              (management.canTransfer || management.pendingTransfer) ? (
                <button
                  type="button"
                  onClick={() => {
                    setView('transfer');
                  }}
                  className={`${action} border border-white/20 text-white/85 hover:bg-white/5`}
                >
                  {management.pendingTransfer
                    ? 'Manage invitation'
                    : management.ownership === 'unassigned'
                      ? 'Invite attendee'
                      : 'Transfer ticket'}
                </button>
              ) : null}
            </div>
            {readState === 'loading' ? (
              <p role="status" className="text-xs text-white/45">
                Checking ticket ownership…
              </p>
            ) : readState === 'failed' ? (
              <p role="status" className="text-xs leading-5 text-white/55">
                Ownership details could not be refreshed.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setReadState('loading');
                    setAttempt((value) => value + 1);
                  }}
                  className="min-h-8 underline underline-offset-4"
                >
                  Retry
                </button>
              </p>
            ) : management?.transferUnavailableReason && !management.pendingTransfer ? (
              <p className="text-xs leading-5 text-white/45">
                {management.transferUnavailableReason}
              </p>
            ) : null}
            {readState === 'ready' && management && management.unitKind !== 'free_rsvp' ? (
              <GuestRefundRequest
                key={management.id}
                ticketId={management.id}
                initialReview={management.refundReview}
                allowed={management.canRequestRefund}
                reason={management.refundUnavailableReason}
              />
            ) : null}
            {readState === 'ready' &&
            management?.unitKind === 'free_rsvp' &&
            management.ownership === 'you' &&
            management.status === 'active' ? (
              <RsvpCancellation
                orderId={management.orderId}
                onCancelled={() => {
                  setChanged(true);
                  setReadState('loading');
                  setAttempt((value) => value + 1);
                }}
              />
            ) : null}

            {ticket.ticketAddons?.length ? (
              <section aria-label="Ticket extras" className="border-t border-white/10 pt-4">
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

            {ticket.eventCover ? (
              <section
                aria-label="Event cover wallet"
                className="space-y-3 border-t border-white/10 pt-4"
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

            {ticket.bookingReference ? (
              <details className="border-t border-white/10 pt-3 text-xs text-white/50">
                <summary className="min-h-8 cursor-pointer py-2">Booking reference</summary>
                <p className="break-all pb-2 font-mono text-white/70">{ticket.bookingReference}</p>
              </details>
            ) : null}
          </div>
        )
      ) : null}
    </Dialog>,
    document.body,
  );
}

function EntryCode({ ticket }: { ticket: UserTicketItem }) {
  const [code, setCode] = useState<MagicQrResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const next = await bffClient.get({
          path: `/api/tickets/${encodeURIComponent(ticket.id)}/qr`,
          schema: magicQrResponseSchema,
        });
        if (!cancelled) {
          setCode(next);
          setFailed(false);
          timer = setTimeout(() => void load(), Math.max(next.refreshIntervalSec, 1) * 1000);
        }
      } catch {
        if (!cancelled) {
          setCode(null);
          setFailed(true);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ticket.id, attempt]);
  return (
    <div className="flex flex-col items-center gap-4 py-3 text-center">
      {code ? (
        <>
          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG
              value={code.qrPayload}
              size={220}
              level="M"
              marginSize={2}
              title={`Entry code for ${ticket.eventTitle}`}
              role="img"
              aria-label={`Entry code for ${ticket.eventTitle}`}
            />
          </div>
          <p className="text-xs text-white/45">
            Refreshes every {code.refreshIntervalSec}s · scan at the door
          </p>
        </>
      ) : failed ? (
        <>
          <p className="text-sm text-white/65">Entry code unavailable.</p>
          <button
            type="button"
            className={`${action} border border-white/20 text-white`}
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="size-7 rounded-full border-2 border-white/15 border-t-white/70 motion-safe:animate-spin"
          />
          <p role="status" className="text-sm text-white/55">
            Loading entry code…
          </p>
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-white/50">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-5 text-white/90">{value}</dd>
    </div>
  );
}

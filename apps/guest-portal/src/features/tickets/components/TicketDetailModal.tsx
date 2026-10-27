'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

import { magicQrResponseSchema } from '@c1rcle/contracts';
import { Dialog } from '@c1rcle/ui';

import { bffClient } from '@/lib/bff/bff-client';

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

type EntryCodeState =
  { phase: 'loading' } | { phase: 'ready'; code: MagicQrResponse } | { phase: 'failed' };

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const status = ticket ? STATUS_COPY[ticket.status] : null;
  const ticketId = ticket?.status === 'active' ? ticket.id : null;
  const [stored, setStored] = useState<{ ticketId: string | null; state: EntryCodeState }>({
    ticketId: null,
    state: { phase: 'loading' },
  });
  const [attempt, setAttempt] = useState(0);
  const entryCode: EntryCodeState =
    ticketId && stored.ticketId === ticketId ? stored.state : { phase: 'loading' };

  useEffect(() => {
    if (!ticketId) return;
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
  }, [ticketId, attempt]);

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

          {ticketId ? (
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

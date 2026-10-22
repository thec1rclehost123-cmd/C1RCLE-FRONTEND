'use client';

import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';

import { magicQrResponseSchema } from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';

import type { UserTicketItem } from '../types/tickets.types';
import type { MagicQrResponse } from '@c1rcle/contracts';

export interface TicketDetailModalProps {
  ticket: UserTicketItem | null;
  onClose: () => void;
}

/**
 * The rotating entry credential, fetched from `GET /api/tickets/:id/qr`
 * (holder-only, never cached) whenever an open pass is still usable, and
 * re-fetched on the interval the gateway asks for — the payload is an HMAC of
 * the ticket id + a time window, so it changes while the modal is open. A
 * code that cannot be fetched says so rather than showing a placeholder id.
 */
type EntryCodeState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'ready'; code: MagicQrResponse }
  | { phase: 'failed' };

function unusableMessage(status: UserTicketItem['status']): string | null {
  if (status === 'used') return 'This pass has already been used at the door.';
  if (status === 'cancelled') return 'This pass was cancelled and admits nobody.';
  if (status === 'pending') return 'The entry code appears once payment completes.';
  return null;
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const [stored, setStored] = useState<{ ticketId: string | null; state: EntryCodeState }>({
    ticketId: null,
    state: { phase: 'idle' },
  });
  const [attempt, setAttempt] = useState(0);
  const ticketId = ticket !== null && ticket.status === 'active' ? ticket.id : null;
  // Derived, not reset inside the effect: a code recorded for another pass (or
  // none) is not this pass's code, so opening or switching tickets lands in
  // the loading branch without a synchronous setState cascade.
  const entryCode: EntryCodeState =
    ticketId === null
      ? { phase: 'idle' }
      : stored.ticketId === ticketId
        ? stored.state
        : { phase: 'loading' };

  useEffect(() => {
    if (ticketId === null) {
      return;
    }
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const load = async (): Promise<void> => {
      try {
        const code = await bffClient.get({
          path: `/api/tickets/${encodeURIComponent(ticketId)}/qr`,
          schema: magicQrResponseSchema,
        });
        if (cancelled) return;
        setStored({ ticketId, state: { phase: 'ready', code } });
        refreshTimer = setTimeout(
          () => {
            void load();
          },
          Math.max(code.refreshIntervalSec, 1) * 1000,
        );
      } catch {
        if (cancelled) return;
        setStored({ ticketId, state: { phase: 'failed' } });
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (refreshTimer !== undefined) clearTimeout(refreshTimer);
    };
  }, [ticketId, attempt]);

  if (!ticket) return null;

  const unusable = unusableMessage(ticket.status);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/88 p-0 backdrop-blur-2xl md:p-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4400]/22 blur-[150px]" />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-detail-title"
        className="relative h-full w-full overflow-hidden text-white shadow-[0_32px_120px_-20px_rgba(0,0,0,0.72)] md:h-auto md:max-w-[410px] md:rounded-[48px] md:border md:border-white/20"
      >
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,68,0,0.34),rgba(255,255,255,0.02)_38%,rgba(255,68,0,0.12))]" />
        <div className="relative flex h-full w-full flex-col items-center overflow-y-auto bg-black/68 p-4 pt-8 backdrop-blur-3xl sm:pt-10 md:h-auto md:rounded-[46px] md:p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ticket view"
            className="absolute right-5 top-5 z-10 flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white/60 transition-colors hover:bg-white/15 hover:text-white"
          >
            ✕
          </button>

          <p className="mb-2 pr-12 text-[9px] font-black uppercase tracking-[0.32em] text-[#FF5A2B]">
            THE C1RCLE PASS
          </p>
          <h2
            id="ticket-detail-title"
            className="mx-auto mb-2 max-w-[320px] text-center text-2xl font-black uppercase leading-[0.94] tracking-[-0.04em] md:text-3xl"
          >
            {ticket.eventTitle}
          </h2>

          <div className="mb-4 flex flex-col items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">
              TICKET 1 OF {ticket.ticketCount}
            </p>
            <div className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: ticket.ticketCount }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1 rounded-full ${index === 0 ? 'w-4 bg-[#FF4400]' : 'w-1 bg-white/15'}`}
                />
              ))}
            </div>
          </div>

          <div className="relative flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[32px] border border-white/45 bg-white p-6 text-center shadow-2xl">
            {ticketId !== null && entryCode.phase === 'ready' ? (
              <QRCodeSVG
                value={entryCode.code.qrPayload}
                size={232}
                level="M"
                marginSize={2}
                title={`Entry code for ${ticket.eventTitle}`}
                role="img"
                aria-label={`Entry code for ${ticket.eventTitle}`}
                className="relative h-auto w-full"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#f6f6f6_0,#f6f6f6_13px,#ececec_13px,#ececec_26px)]" />
                <div className="relative">
                  {ticketId === null ? (
                    <>
                      <p className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.045em] text-black">
                        No entry
                        <br />
                        code
                      </p>
                      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.28em] text-[#FF4400]">
                        {unusable}
                      </p>
                    </>
                  ) : entryCode.phase === 'failed' ? (
                    <>
                      <p className="text-xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-black">
                        Entry code
                        <br />
                        unavailable
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          // Drop the stale failure so the retry reads as
                          // loading instead of "unavailable" for a moment.
                          setStored({ ticketId: null, state: { phase: 'idle' } });
                          setAttempt((current) => current + 1);
                        }}
                        className="mt-5 rounded-full border border-black/25 px-5 py-2 text-[9px] font-black uppercase tracking-[0.28em] text-black transition-colors hover:bg-black hover:text-white"
                      >
                        Try again
                      </button>
                    </>
                  ) : (
                    <p className="text-xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-black">
                      Fetching
                      <br />
                      entry code…
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {ticketId !== null && entryCode.phase === 'ready' ? (
            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.24em] text-white/45">
              Refreshes every {entryCode.code.refreshIntervalSec}s · scan at the door
            </p>
          ) : null}

          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              {ticket.tierName}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${
                ticket.status === 'used'
                  ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                  : ticket.status === 'cancelled'
                    ? 'border-red-400/20 bg-red-400/10 text-red-300'
                    : 'border-blue-400/20 bg-blue-400/10 text-blue-300'
              }`}
            >
              {ticket.status === 'used'
                ? 'CHECKED IN'
                : ticket.status === 'cancelled'
                  ? 'CANCELLED'
                  : 'ACTIVE'}
            </span>
          </div>

          <div className="mt-5 w-full border-t border-white/10 pt-4 text-center">
            <p className="text-xs font-bold text-white/82">
              {ticket.date} • {ticket.time}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
              {ticket.venueName}, {ticket.city}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

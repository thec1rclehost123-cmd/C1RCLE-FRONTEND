'use client';

// FIXTURE_ONLY: Temporary UI development ticket detail QR modal.

import React from 'react';

import type { UserTicketItem } from '../types/tickets.types';

export interface TicketDetailModalProps {
  ticket: UserTicketItem | null;
  onClose: () => void;
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  if (!ticket) return null;

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

          {/* Deliberately non-scannable fixture marker */}
          <div className="relative flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[32px] border border-white/45 bg-white p-6 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#f6f6f6_0,#f6f6f6_13px,#ececec_13px,#ececec_26px)]" />
            <div>
              <p className="relative text-3xl font-black uppercase leading-[0.9] tracking-[-0.045em] text-black">
                Not valid
                <br />
                for entry
              </p>
              <p className="relative mt-4 text-[9px] font-black uppercase tracking-[0.28em] text-[#FF4400]">
                Decorative pass preview
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              {ticket.tierName}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${
                ticket.status === 'used'
                  ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                  : 'border-blue-400/20 bg-blue-400/10 text-blue-300'
              }`}
            >
              {ticket.status === 'used' ? 'CHECKED IN' : 'ACTIVE'}
            </span>
          </div>

          <div className="mt-5 w-full border-t border-white/10 pt-4 text-center">
            <p className="text-xs font-bold text-white/82">
              {ticket.date} • {ticket.time}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
              {ticket.venueName}, {ticket.city}
            </p>
            <p className="mt-3 text-[8px] font-black uppercase tracking-[0.25em] text-white/22">
              {ticket.qrPayload.replaceAll('_', ' ')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

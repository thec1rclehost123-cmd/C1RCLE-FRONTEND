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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
      <div className="relative w-full max-w-sm rounded-[32px] border border-white/20 bg-zinc-950 p-6 text-white shadow-2xl flex flex-col items-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close ticket view"
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          ✕
        </button>

        {/* Brand Tagline */}
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4400] mb-2">
          THE C1RCLE • DECORATIVE PASS PREVIEW
        </span>

        <h3 className="text-xl font-black uppercase tracking-tight text-center mb-1">
          {ticket.eventTitle}
        </h3>

        <p className="text-xs font-bold text-white/60 mb-6">
          {ticket.tierName} • {ticket.ticketCount} {ticket.ticketCount > 1 ? 'Guests' : 'Guest'}
        </p>

        {/* Deliberately non-scannable fixture marker */}
        <div className="relative mb-6 flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border border-[#FF4400]/35 bg-[repeating-linear-gradient(135deg,#171717_0,#171717_14px,#20100a_14px,#20100a_28px)] p-6 text-center shadow-lg">
          <div>
            <p className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white">
              Not valid
              <br />
              for entry
            </p>
            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.28em] text-[#FF4400]">
              Fixture UI only
            </p>
          </div>
        </div>

        <p className="text-[10px] font-mono font-bold text-white/40 tracking-widest mb-6">
          {ticket.qrPayload.replaceAll('_', ' ')}
        </p>

        <div className="w-full pt-4 border-t border-white/10 text-center">
          <p className="text-xs font-bold text-white/80">{ticket.date}</p>
          <p className="text-[11px] font-medium text-white/50">{ticket.venueName}, {ticket.city}</p>
        </div>
      </div>
    </div>
  );
}

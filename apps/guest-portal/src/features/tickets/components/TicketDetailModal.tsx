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
          THE C1RCLE • ENTRY PASS
        </span>

        <h3 className="text-xl font-black uppercase tracking-tight text-center mb-1">
          {ticket.eventTitle}
        </h3>

        <p className="text-xs font-bold text-white/60 mb-6">
          {ticket.tierName} • {ticket.ticketCount} {ticket.ticketCount > 1 ? 'Guests' : 'Guest'}
        </p>

        {/* QR Code Container */}
        <div className="relative p-5 rounded-2xl bg-white flex flex-col items-center justify-center shadow-lg mb-6 w-56 h-56">
          {/* Simulated QR Code Graphic */}
          <div className="w-full h-full bg-black/90 p-4 rounded-xl flex flex-col justify-between items-center relative overflow-hidden">
            <div className="grid grid-cols-5 gap-1.5 w-full h-full">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-xs ${
                    i % 2 === 0 || i % 3 === 0 ? 'bg-white' : 'bg-[#FF4400]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-[10px] font-mono font-bold text-white/40 tracking-widest mb-6">
          {ticket.qrPayload}
        </p>

        <div className="w-full pt-4 border-t border-white/10 text-center">
          <p className="text-xs font-bold text-white/80">{ticket.date}</p>
          <p className="text-[11px] font-medium text-white/50">{ticket.venueName}, {ticket.city}</p>
        </div>
      </div>
    </div>
  );
}

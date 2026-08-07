'use client';

// FIXTURE_ONLY: Temporary UI development user ticket card.

import Image from 'next/image';
import React from 'react';

import type { UserTicketItem } from '../types/tickets.types';

export interface UserTicketCardProps {
  ticket: UserTicketItem;
  onSelect: (ticket: UserTicketItem) => void;
  isPast?: boolean;
}

export function UserTicketCard({ ticket, onSelect, isPast = false }: UserTicketCardProps) {
  return (
    <div
      className={`relative group flex flex-col sm:flex-row items-center gap-6 p-5 rounded-[28px] border transition-all duration-300 ${
        isPast
          ? 'border-white/5 bg-zinc-950/60 opacity-60 grayscale'
          : 'border-white/10 bg-zinc-900/80 backdrop-blur-2xl hover:border-white/20 shadow-xl hover:shadow-[#FF4400]/10'
      }`}
    >
      {/* Poster Image */}
      <div className="relative w-full sm:w-32 h-44 sm:h-36 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
        <Image
          src={ticket.posterUrl}
          alt={ticket.eventTitle}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {ticket.isVip && (
          <span className="absolute top-3 left-3 bg-[#FF4400] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md z-10">
            VIP
          </span>
        )}
      </div>

      {/* Ticket Details */}
      <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4400]">
              {ticket.tierName}
            </span>
            <span className="text-white/30">•</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              {ticket.ticketCount} {ticket.ticketCount > 1 ? 'Passes' : 'Pass'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2 truncate">
            {ticket.eventTitle}
          </h3>

          <p className="text-xs font-bold text-white/70 mb-1">
            {ticket.date} • {ticket.time}
          </p>

          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
            {ticket.venueName}, {ticket.city}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => {
              onSelect(ticket);
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              isPast
                ? 'bg-white/10 text-white/60 hover:bg-white/20'
                : 'bg-white text-black hover:bg-white/90 hover:scale-105 shadow-md'
            }`}
          >
            {isPast ? 'VIEW PREVIEW RECEIPT' : 'VIEW PASS PREVIEW'}
          </button>

          {!isPast && (
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined') {
                  void navigator.clipboard.writeText(`C1RCLE Pass: ${ticket.eventTitle}`);
                }
              }}
              aria-label="Share ticket link"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/15 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-5.368m0 5.368l5.66 3.234m-5.66-3.234l5.66-3.234m0 0a3 3 0 10-5.368-2.684m5.368 2.684a3 3 0 10-5.368 2.684"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

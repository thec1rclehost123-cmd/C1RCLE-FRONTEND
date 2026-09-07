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
    <div className="group relative overflow-visible">
      {!isPast && (
        <div className="pointer-events-none absolute inset-x-[10%] -inset-y-5 rounded-full bg-[#FF4400]/12 opacity-70 blur-[70px] transition-opacity duration-500 group-hover:opacity-100" />
      )}

      <article
        className={`relative flex min-h-[210px] flex-col items-center gap-6 overflow-hidden rounded-[32px] border p-5 transition-all duration-300 sm:flex-row ${
          isPast
            ? 'border-white/5 bg-zinc-950/60 opacity-60 grayscale'
            : 'border-white/10 bg-[#141416]/82 shadow-[0_28px_75px_-30px_rgba(255,68,0,0.38)] backdrop-blur-2xl hover:-translate-y-1 hover:border-white/20'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,68,0,0.045),transparent_45%)]" />

        {/* Poster Image */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-zinc-950 shadow-xl sm:h-40 sm:w-36">
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
        <div className="relative flex h-full min-w-0 w-full flex-1 flex-col justify-between py-1">
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

            <h3 className="mb-2 text-xl font-black uppercase tracking-[-0.035em] text-white sm:text-2xl">
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
          <div className="mt-6 flex flex-wrap items-center gap-3">
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

        <div className="pointer-events-none absolute -bottom-3.5 left-[170px] hidden size-7 rounded-full border border-white/5 bg-black sm:block" />
        <div className="pointer-events-none absolute -top-3.5 left-[170px] hidden size-7 rounded-full border border-white/5 bg-black sm:block" />
      </article>
    </div>
  );
}

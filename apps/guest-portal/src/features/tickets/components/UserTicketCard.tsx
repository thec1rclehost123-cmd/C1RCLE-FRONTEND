'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { UserTicketItem } from '../types/tickets.types';

export interface UserTicketCardProps {
  ticket: UserTicketItem;
  onSelect: (ticket: UserTicketItem) => void;
  isPast?: boolean;
}

export function UserTicketCard({ ticket, onSelect, isPast = false }: UserTicketCardProps) {
  const [posterUnavailable, setPosterUnavailable] = useState(false);
  const hasPoster = ticket.posterUrl !== '/c1rcle-logo.webp' && !posterUnavailable;
  const place = [ticket.venueName, ticket.city]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

  return (
    <article className="group relative min-w-0">
      <button
        type="button"
        aria-label="View ticket details"
        onClick={() => {
          onSelect(ticket);
        }}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.35rem] bg-[#f2e9dc] text-left text-[#251915] shadow-[0_18px_45px_-22px_rgba(0,0,0,0.85)] outline-none transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_-20px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-[#ff6842] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <div className="relative flex w-full items-center justify-center px-3 pb-3 pt-6 sm:px-7 sm:pb-7 sm:pt-9">
          <span
            className="absolute inset-x-0 top-0 h-2.5 bg-[radial-gradient(circle_at_50%_0,#080706_5px,transparent_5.5px)] bg-[length:25px_10px] bg-repeat-x"
            aria-hidden="true"
          />
          <span className="text-center text-[8px] font-black uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.24em]">
            THE C1RCLE
          </span>
        </div>

        <div className="w-full px-3 sm:px-7">
          <div
            className={`relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#211714] ${isPast ? 'saturate-50' : ''}`}
          >
            {hasPoster ? (
              <Image
                src={ticket.posterUrl}
                alt={`${ticket.eventTitle} event poster`}
                fill
                unoptimized
                sizes="(max-width: 639px) calc(50vw - 2.5rem), (max-width: 1279px) 40vw, 25vw"
                onError={() => {
                  setPosterUnavailable(true);
                }}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(145deg,#241410,#0b0908_70%)] px-5 text-center text-white">
                <Image
                  src="/c1rcle-logo.webp"
                  alt=""
                  width={54}
                  height={54}
                  className="size-10 object-contain opacity-80 sm:size-14"
                />
                <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-white/45 sm:text-[8px] sm:tracking-[0.16em]">
                  Event artwork unavailable
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col px-3 pb-4 pt-3 sm:px-7 sm:pb-7 sm:pt-6">
          <h2 className="line-clamp-3 text-xs font-black uppercase leading-tight tracking-[-0.035em] sm:line-clamp-2 sm:text-xl">
            {ticket.eventTitle}
          </h2>
          <p className="mt-2 text-[10px] font-semibold leading-4 text-[#5d4b42] sm:text-sm sm:leading-5">
            {[ticket.date, ticket.time].filter(Boolean).join(' · ') || 'Date unavailable'}
          </p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#77655b] sm:text-sm sm:leading-5">
            {place || 'Venue unavailable'}
          </p>
          <div className="mt-auto pt-3 sm:pt-5">
            <div className="relative border-t-2 border-dashed border-[#9b8576]/60 pt-4">
              <span
                className="absolute -left-[1.25rem] -top-3 size-6 rounded-full bg-[#080706] sm:-left-[2.25rem]"
                aria-hidden="true"
              />
              <span
                className="absolute -right-[1.25rem] -top-3 size-6 rounded-full bg-[#080706] sm:-right-[2.25rem]"
                aria-hidden="true"
              />
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#aa492e] sm:text-[10px]">
                    {ticket.ticketCount} {ticket.ticketCount === 1 ? 'pass' : 'passes'}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[10px] font-black uppercase leading-3 sm:text-sm sm:leading-4">
                    {ticket.tierName}
                  </p>
                </div>
                <span className="shrink-0 text-right text-[8px] font-black uppercase tracking-[0.06em] text-[#716057] sm:text-[10px] sm:tracking-[0.12em]">
                  {isPast ? 'Past' : ticket.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <span
          className="absolute inset-x-0 bottom-0 h-2.5 bg-[radial-gradient(circle_at_50%_100%,#080706_5px,transparent_5.5px)] bg-[length:25px_10px] bg-repeat-x"
          aria-hidden="true"
        />
      </button>
    </article>
  );
}

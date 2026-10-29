'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import type { UserTicketItem } from '../types/tickets.types';
import type { ReactNode } from 'react';

export interface UserTicketCardProps {
  ticket: UserTicketItem;
  onSelect: (ticket: UserTicketItem) => void;
  onAddToCalendar: (ticket: UserTicketItem) => void;
  isPast?: boolean;
  isSelected?: boolean;
}

export function UserTicketCard({
  ticket,
  onSelect,
  onAddToCalendar,
  isPast = false,
  isSelected = false,
}: UserTicketCardProps) {
  const [posterUnavailable, setPosterUnavailable] = useState(false);
  const hasPoster = ticket.posterUrl !== '/c1rcle-logo.webp' && !posterUnavailable;
  const eventTitle = formatEventTitle(ticket.eventTitle);
  const eventDate = formatEventDate(ticket.date);
  const eventDay =
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\b/i.exec(
      ticket.date,
    )?.[1];
  const canAddToCalendar = Boolean(ticket.startsAt && !Number.isNaN(Date.parse(ticket.startsAt)));

  return (
    <article className="min-w-0">
      <div
        className={`group relative isolate flex min-h-[21rem] w-full flex-col overflow-hidden rounded-2xl border bg-[#100e0e] text-white shadow-[0_16px_42px_-28px_rgba(0,0,0,0.9)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-white/20 motion-reduce:transform-none motion-reduce:transition-none sm:min-h-[23rem] ${
          isSelected
            ? 'border-[#ff6842]/65 shadow-[0_0_54px_-12px_rgba(255,82,38,0.58),0_22px_50px_-25px_rgba(0,0,0,0.95)]'
            : 'border-[#ff6842]/20 shadow-[0_0_38px_-20px_rgba(255,82,38,0.42),0_16px_42px_-28px_rgba(0,0,0,0.9)] hover:border-[#ff6842]/45 hover:shadow-[0_0_48px_-16px_rgba(255,82,38,0.5),0_18px_44px_-26px_rgba(0,0,0,0.95)]'
        }`}
      >
        {hasPoster ? (
          <Image
            src={ticket.posterUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            onError={() => {
              setPosterUnavailable(true);
            }}
            className={`absolute scale-[1.18] object-cover opacity-[0.19] blur-[38px] transition-[opacity,transform] duration-500 group-hover:scale-[1.24] group-hover:opacity-[0.28] motion-reduce:transition-none ${isSelected ? 'opacity-[0.32]' : ''} ${isPast ? 'saturate-50' : ''}`}
          />
        ) : null}
        <div
          className={`absolute inset-0 ${hasPoster ? 'bg-[linear-gradient(180deg,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.62)_42%,rgba(0,0,0,0.86)_100%)]' : 'bg-[#100e0e]'}`}
          aria-hidden="true"
        />
        {!hasPoster && eventDay ? (
          <span
            className="pointer-events-none absolute inset-x-0 top-[27%] select-none text-center text-[8rem] font-black leading-none tracking-[-0.1em] text-white/[0.08] sm:text-[10rem]"
            aria-hidden="true"
          >
            {eventDay}
          </span>
        ) : null}
        <div className="relative flex flex-1 flex-col px-3 pb-3 pt-4 sm:px-5 sm:pb-5 sm:pt-6">
          <h2 className="line-clamp-2 text-center text-base font-semibold leading-tight tracking-[-0.04em] sm:text-xl">
            {ticket.eventSlug ? (
              <Link
                href={`/event/${encodeURIComponent(ticket.eventSlug)}`}
                className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6842]"
              >
                {eventTitle}
              </Link>
            ) : (
              eventTitle
            )}
          </h2>
          <div className="mt-2 flex min-h-5 items-center justify-center gap-1.5 text-center text-[10px] leading-4 text-white/70 sm:text-xs">
            <CalendarGlyph />
            <span className="min-w-0 truncate">
              {eventDate || 'Date unavailable'}
              {ticket.time ? ` · ${ticket.time}` : ''}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 text-[11px] sm:mt-5 sm:gap-x-3 sm:text-sm">
            <span className="flex min-w-0 items-center gap-2 text-left text-white/90">
              <TicketGlyph />
              <span className="line-clamp-2 min-w-0 leading-4">{ticket.tierName}</span>
            </span>
            <span className="whitespace-nowrap text-right tabular-nums text-white/80">
              {ticket.ticketCount} {ticket.ticketCount === 1 ? 'pass' : 'passes'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="rounded-full border border-white/15 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-white/60 sm:text-[9px]">
              {isPast ? 'Past' : ticket.status.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-auto grid grid-cols-4 place-items-center pt-3">
            <ActionButton
              label={`Show QR code for ${eventTitle}`}
              onClick={() => {
                onSelect(ticket);
              }}
            >
              <QrGlyph />
            </ActionButton>
            <ActionButton
              label="View ticket details"
              onClick={() => {
                onSelect(ticket);
              }}
            >
              <InfoGlyph />
            </ActionButton>
            <ActionButton
              label="Apple Wallet pass unavailable"
              title="Apple Wallet pass unavailable"
              disabled
            >
              <WalletGlyph />
            </ActionButton>
            <ActionButton
              label={
                canAddToCalendar ? `Add ${eventTitle} to calendar` : 'Calendar details unavailable'
              }
              onClick={() => {
                onAddToCalendar(ticket);
              }}
              disabled={!canAddToCalendar}
            >
              <CalendarGlyph />
            </ActionButton>
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  label,
  title,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6842] disabled:cursor-not-allowed disabled:text-white/40 disabled:hover:bg-transparent motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}

function TicketGlyph() {
  return (
    <svg aria-hidden="true" className="mt-0.5 size-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.5 7.5A2.5 2.5 0 0 0 6 5h12a2.5 2.5 0 0 0 2.5 2.5v9A2.5 2.5 0 0 0 18 19H6a2.5 2.5 0 0 0-2.5-2.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 7.5v1.7m0 2v1.7m0 2v1.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QrGlyph() {
  return (
    <svg aria-hidden="true" className="size-[22px]" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 14h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z" fill="currentColor" />
    </svg>
  );
}

function InfoGlyph() {
  return (
    <svg aria-hidden="true" className="size-[22px]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 10.8v5m0-8.1h.01"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalletGlyph() {
  return (
    <svg aria-hidden="true" className="size-[22px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 8h13a2 2 0 0 1 2 2v3h-5a2 2 0 0 1 0-4h5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M15 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CalendarGlyph() {
  return (
    <svg aria-hidden="true" className="size-[22px]" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8 4v4m8-4v4M4 10h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatEventTitle(value: string) {
  return value
    .replace(/-\d{8}(?:-\d+)?(?:-.*)?$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\bcap(\d+)\b/gi, 'Cap $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w+/g, (word) => {
      if (/^m\d+$/i.test(word)) return word.toUpperCase();
      if (word.toLowerCase() === 'rsvp') return 'RSVP';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

function formatEventDate(value: string) {
  return value
    .replace(/^(\w+),\s*/, (_, weekday: string) => `${weekday.slice(0, 3)}, `)
    .replace(/,\s+\d{4}$/, '');
}

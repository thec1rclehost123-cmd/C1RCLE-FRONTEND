'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { Suspense, useState } from 'react';

import { groupTicketsByBooking } from '../booking-ticket-groups';

import { UserTicketCard } from './UserTicketCard';

import type { TicketTab, TicketWalletData, UserTicketItem } from '../types/tickets.types';

const TicketDetailModal = dynamic(() =>
  import('./TicketDetailModal').then((module) => module.TicketDetailModal),
);

export interface UserTicketsViewProps {
  wallet: TicketWalletData;
  onRefresh?: (() => void) | undefined;
}

export function UserTicketsView({ wallet, onRefresh }: UserTicketsViewProps) {
  const [detailView, setDetailView] = useState<'booking' | 'details' | 'qr'>('details');
  const [activeTab, setActiveTab] = useState<TicketTab>('upcoming');
  const [selectedTicket, setSelectedTicket] = useState<UserTicketItem | null>(null);

  const unavailableTickets = wallet.unavailableTickets ?? [];
  const bookings = groupTicketsByBooking([
    ...wallet.upcomingTickets,
    ...wallet.pastTickets,
    ...unavailableTickets,
  ]);
  const upcomingIds = new Set(wallet.upcomingTickets.map((ticket) => ticket.id));
  const pastIds = new Set(wallet.pastTickets.map((ticket) => ticket.id));
  const visibleBookings = bookings.filter((booking) =>
    activeTab === 'upcoming'
      ? booking.tickets.some((ticket) => upcomingIds.has(ticket.id))
      : booking.tickets.every((ticket) => pastIds.has(ticket.id)),
  );
  const unresolvedBookings = bookings.filter(
    (booking) =>
      !booking.tickets.some((ticket) => upcomingIds.has(ticket.id)) &&
      !booking.tickets.every((ticket) => pastIds.has(ticket.id)),
  );
  const selectedBooking = selectedTicket
    ? bookings.find((booking) => booking.tickets.some((ticket) => ticket.id === selectedTicket.id))
    : undefined;
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 pt-32 text-white sm:px-8 sm:pt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-20vw] top-[-8rem] z-0 h-[38rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,68,0,0.24)_0%,rgba(255,68,0,0.09)_42%,transparent_72%)] blur-2xl"
      />
      {/* Header & Tab Selector */}
      <div className="relative z-10 mb-7 grid gap-4 sm:mb-10 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="hidden md:block" aria-hidden="true" />
        <h1 className="text-center text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
          My Orders
        </h1>

        {/* Tab Buttons */}
        <div className="flex w-full gap-1 rounded-full border border-white/10 bg-black/55 p-1 backdrop-blur-xl sm:mx-auto sm:w-fit sm:gap-2 sm:p-1.5 md:mx-0 md:justify-self-end">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upcoming');
            }}
            className={`min-h-10 flex-1 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.14em] transition-colors motion-reduce:transition-none sm:min-h-11 sm:flex-none sm:px-6 sm:text-xs sm:tracking-widest ${
              activeTab === 'upcoming'
                ? 'bg-white text-black shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            CURRENT PASSES
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('past');
            }}
            className={`min-h-10 flex-1 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.14em] transition-colors motion-reduce:transition-none sm:min-h-11 sm:flex-none sm:px-6 sm:text-xs sm:tracking-widest ${
              activeTab === 'past'
                ? 'bg-white text-black shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            HISTORY
          </button>
        </div>
      </div>

      {wallet.ownershipAvailable === false ? (
        <p role="status" className="relative z-10 mb-5 text-sm text-white/60">
          Some booking ownership details could not be loaded.{' '}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-11 underline underline-offset-4"
            >
              Retry
            </button>
          ) : null}
        </p>
      ) : null}
      {/* Ticket List Grid */}
      {visibleBookings.length > 0 ? (
        <div className="relative z-10 grid w-full grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-3">
          {visibleBookings.map((booking) => (
            <UserTicketCard
              key={booking.key}
              ticket={booking.primaryTicket}
              bookingTickets={booking.tickets}
              isPast={activeTab === 'past'}
              isSelected={booking.tickets.some((ticket) => selectedTicket?.id === ticket.id)}
              onSelect={(item) => {
                setDetailView(booking.tickets.length > 1 ? 'booking' : 'details');
                setSelectedTicket(item);
              }}
              onShowQr={(item) => {
                setDetailView('qr');
                setSelectedTicket(item);
              }}
              onAddToCalendar={downloadCalendarEvent}
            />
          ))}
        </div>
      ) : unresolvedBookings.length === 0 ? (
        /* Empty State */
        <div className="relative z-10 flex flex-col items-center justify-center rounded-[1.75rem] border border-white/10 bg-black/45 px-4 py-16 text-center backdrop-blur-xl sm:py-20">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
            🎟️
          </div>
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            NO {activeTab === 'upcoming' ? 'CURRENT PASSES' : 'PAST TICKETS'} YET
          </h3>
          <p className="mb-8 max-w-sm text-xs font-medium text-white/50">
            {activeTab === 'upcoming'
              ? 'Your confirmed event tickets will appear here.'
              : 'Used, refunded, cancelled, and past tickets will appear here.'}
          </p>
          <Link
            href="/explore"
            className="rounded-full bg-white px-8 py-3.5 text-xs font-black uppercase tracking-widest text-black shadow-lg transition-all hover:bg-white/90"
          >
            EXPLORE EVENTS
          </Link>
        </div>
      ) : null}

      {unresolvedBookings.length > 0 ? (
        <section aria-label="Tickets" className="relative z-10 mt-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {unresolvedBookings.map((booking) => (
              <UserTicketCard
                key={booking.key}
                ticket={booking.primaryTicket}
                bookingTickets={booking.tickets}
                isSelected={booking.tickets.some((ticket) => selectedTicket?.id === ticket.id)}
                onSelect={(item) => {
                  setDetailView(booking.tickets.length > 1 ? 'booking' : 'details');
                  setSelectedTicket(item);
                }}
                onShowQr={(item) => {
                  setDetailView('qr');
                  setSelectedTicket(item);
                }}
                onAddToCalendar={downloadCalendarEvent}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Authoritative ticket detail; admission credentials remain an M4 capability. */}
      {selectedTicket ? (
        <Suspense
          fallback={
            <p
              role="status"
              className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-5 py-3 text-sm text-white"
            >
              Loading tickets…
            </p>
          }
        >
          <TicketDetailModal
            key={selectedTicket.id}
            ticket={selectedTicket}
            bookingTickets={selectedBooking?.tickets}
            initialView={detailView}
            onOwnershipChanged={onRefresh}
            onSelectTicket={(item) => {
              setDetailView('details');
              setSelectedTicket(item);
            }}
            onClose={() => {
              setSelectedTicket(null);
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

function downloadCalendarEvent(ticket: UserTicketItem) {
  if (!ticket.startsAt) return;
  const startsAt = new Date(ticket.startsAt);
  if (Number.isNaN(startsAt.getTime())) return;

  const endsAt = ticket.endsAt ? new Date(ticket.endsAt) : null;
  const validEnd = endsAt && !Number.isNaN(endsAt.getTime()) && endsAt > startsAt ? endsAt : null;
  const calendarDate = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const escapeText = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const location = [ticket.venueName, ticket.city]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
  const eventTitle = ticket.eventTitle
    .replace(/-\d{8}(?:-\d+)?(?:-.*)?$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//THE C1RCLE//Guest Portal//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeText(ticket.id)}@thec1rcle`,
    `DTSTAMP:${calendarDate(new Date())}`,
    `DTSTART:${calendarDate(startsAt)}`,
    ...(validEnd ? [`DTEND:${calendarDate(validEnd)}`] : []),
    `SUMMARY:${escapeText(eventTitle)}`,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'c1rcle-event'}.ics`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

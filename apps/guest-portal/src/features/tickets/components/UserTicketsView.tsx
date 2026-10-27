'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { EventArtworkBackdrop } from '@/components/layout/EventArtworkBackdrop';

import { TicketDetailModal } from './TicketDetailModal';
import { UserTicketCard } from './UserTicketCard';

import type { TicketTab, TicketWalletData, UserTicketItem } from '../types/tickets.types';

export interface UserTicketsViewProps {
  wallet: TicketWalletData;
}

export function UserTicketsView({ wallet }: UserTicketsViewProps) {
  const [activeTab, setActiveTab] = useState<TicketTab>('upcoming');
  const [selectedTicket, setSelectedTicket] = useState<UserTicketItem | null>(null);

  const tickets = activeTab === 'upcoming' ? wallet.upcomingTickets : wallet.pastTickets;
  const ambientImage =
    wallet.upcomingTickets[0]?.posterUrl ?? wallet.pastTickets[0]?.posterUrl ?? null;

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-24 pt-24 text-white sm:px-8 sm:pt-28">
      <EventArtworkBackdrop image={ambientImage} />
      {/* Header & Tab Selector */}
      <div className="relative mb-7 flex flex-col gap-5 sm:mb-10 md:flex-row md:items-end md:justify-between md:gap-6">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="h-0.5 w-6 bg-[#FF4400]" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/45 sm:text-[10px] sm:tracking-[0.4em]">
              YOUR COLLECTION
            </span>
          </div>
          <h1 className="text-[clamp(2.8rem,8vw,5.5rem)] font-black uppercase leading-[0.88] tracking-[-0.06em] text-white">
            TICKETS
          </h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex w-full gap-1 rounded-full border border-white/10 bg-black/55 p-1 backdrop-blur-xl sm:w-fit sm:gap-2 sm:p-1.5 md:self-auto">
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

      {/* Ticket List Grid */}
      {tickets.length > 0 ? (
        <div className="relative grid w-full grid-cols-2 items-stretch gap-3 sm:gap-6 xl:grid-cols-3">
          {tickets.map((ticket) => (
            <UserTicketCard
              key={ticket.id}
              ticket={ticket}
              isPast={activeTab === 'past'}
              onSelect={setSelectedTicket}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="relative flex flex-col items-center justify-center rounded-[1.75rem] border border-white/10 bg-black/45 px-4 py-16 text-center backdrop-blur-xl sm:py-20">
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
      )}

      {/* Authoritative ticket detail; admission credentials remain an M4 capability. */}
      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => {
          setSelectedTicket(null);
        }}
      />
    </div>
  );
}

'use client';

// FIXTURE_ONLY: Temporary UI development user tickets collection view.

import Link from 'next/link';
import React, { useState } from 'react';

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

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-6 pt-28 pb-20 sm:px-8 flex-1 flex flex-col">
      {/* Header & Tab Selector */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-0.5 w-6 bg-[#FF4400]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
              YOUR COLLECTION
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter text-white">
            TICKETS
          </h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upcoming');
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
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
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'past'
                ? 'bg-white text-black shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            HISTORY
          </button>
        </div>
      </div>

      {/* Pending Incomplete Payment Alert */}
      {wallet.pendingReservation && activeTab === 'upcoming' && (
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-[#FF4400]/30 bg-[#FF4400]/10 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF4400] animate-ping" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#FF4400]">
                INCOMPLETE PAYMENT
              </p>
              <p className="text-sm font-bold text-white mt-0.5">
                {wallet.pendingReservation.eventTitle}
              </p>
            </div>
          </div>
          <Link
            href={`/checkout/${wallet.pendingReservation.eventId}`}
            className="px-5 py-2 rounded-full bg-[#FF4400] text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF4400]/90 transition-all shadow-md self-end sm:self-auto"
          >
            RESUME PAYMENT →
          </Link>
        </div>
      )}

      {/* Ticket List Grid */}
      {tickets.length > 0 ? (
        <div className="flex flex-col gap-6 w-full">
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
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6 text-2xl">
            🎟️
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">
            NO {activeTab === 'upcoming' ? 'CURRENT PASSES' : 'PAST TICKETS'} YET
          </h3>
          <p className="text-xs font-medium text-white/50 max-w-sm mb-8">
            {activeTab === 'upcoming'
              ? 'Your purchased event passes and VIP entry keys will appear here.'
              : 'Your attended events and past experience receipts will be saved here.'}
          </p>
          <Link
            href="/explore"
            className="px-8 py-3.5 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg"
          >
            EXPLORE EVENTS
          </Link>
        </div>
      )}

      {/* Detail QR Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => {
          setSelectedTicket(null);
        }}
      />
    </div>
  );
}

'use client';

// FIXTURE_ONLY: Temporary UI development tickets client orchestration.

import React, { useState } from 'react';

import { TicketsGuestView } from '../../features/tickets/components/TicketsGuestView';
import { UserTicketsView } from '../../features/tickets/components/UserTicketsView';
import { ticketsFixture } from '../../features/tickets/fixtures/tickets.fixture';

export function TicketsClient() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Logged-in view by default as requested

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between">
      {/* Dev Fixture View State Toggle Switcher */}
      <div className="fixed bottom-20 right-6 z-40 flex items-center gap-2 p-1.5 rounded-full border border-white/20 bg-black/80 backdrop-blur-2xl shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setIsLoggedIn(true);
          }}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            isLoggedIn
              ? 'bg-[#FF4400] text-white shadow-md'
              : 'text-white/50 hover:text-white'
          }`}
        >
          LOGGED IN
        </button>
        <button
          type="button"
          onClick={() => {
            setIsLoggedIn(false);
          }}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            !isLoggedIn
              ? 'bg-white text-black shadow-md'
              : 'text-white/50 hover:text-white'
          }`}
        >
          GUEST SHOWCASE
        </button>
      </div>

      {isLoggedIn ? (
        <UserTicketsView wallet={ticketsFixture.userWallet} />
      ) : (
        <TicketsGuestView
          headline={ticketsFixture.headline}
          tagline={ticketsFixture.tagline}
          items={ticketsFixture.items}
        />
      )}
    </div>
  );
}

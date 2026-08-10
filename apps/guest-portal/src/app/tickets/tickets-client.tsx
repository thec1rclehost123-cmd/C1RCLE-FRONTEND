'use client';

// FIXTURE_ONLY: Temporary UI development tickets client orchestration.

import React from 'react';

import { useSession } from '@c1rcle/auth';

import { TicketsGuestView } from '../../features/tickets/components/TicketsGuestView';
import { UserTicketsView } from '../../features/tickets/components/UserTicketsView';
import { ticketsFixture } from '../../features/tickets/fixtures/tickets.fixture';

export function TicketsClient() {
  const { isAuthenticated } = useSession();

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between">
      {isAuthenticated ? (
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

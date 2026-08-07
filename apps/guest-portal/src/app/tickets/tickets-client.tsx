'use client';

// FIXTURE_ONLY: Temporary UI development tickets client orchestration.

import React from 'react';

import { UserTicketsView } from '../../features/tickets/components/UserTicketsView';
import { ticketsFixture } from '../../features/tickets/fixtures/tickets.fixture';

export function TicketsClient() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between">
      <UserTicketsView wallet={ticketsFixture.userWallet} />
    </div>
  );
}

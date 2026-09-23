'use client';

import React, { useEffect, useState } from 'react';

import { useSession } from '@c1rcle/auth';
import {
  entitlementsListResponseSchema,
  eventDtoSchema,
  venueDtoSchema,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { bffClient } from '@/lib/bff/bff-client';

import { TicketsGuestView } from '../../features/tickets/components/TicketsGuestView';
import { UserTicketsView } from '../../features/tickets/components/UserTicketsView';
import { ticketsFixture } from '../../features/tickets/fixtures/tickets.fixture';
import { toTicketWalletData } from '../../features/tickets/wallet-mapping';

import type { TicketWalletData } from '../../features/tickets/types/tickets.types';

const EMPTY_WALLET: TicketWalletData = { upcomingTickets: [], pastTickets: [] };

/**
 * Authenticated guests see their real wallet: entitlements from the BFF
 * (`GET /api/wallet/tickets`, session-cookie authenticated) mapped to cards
 * with public event/venue reads. Logged-out visitors keep the ticket
 * showcase. A wallet that fails to load renders as empty — never fixtures,
 * never another account's passes.
 */
export function TicketsClient() {
  const { isAuthenticated } = useSession();
  const [wallet, setWallet] = useState<TicketWalletData | null>(null);
  // Derived, never reset in the effect below: while an authenticated wallet
  // is still loading there is nothing to show yet; failures resolve to an
  // (empty) wallet, so this cannot stick.
  const loading = isAuthenticated && wallet === null;

  useEffect(() => {
    // Logged-out visitors never reach the wallet fetch — the guest showcase
    // branch below hides any previously loaded wallet without a state reset.
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    bffClient
      .get({
        path: '/api/wallet/tickets',
        query: { limit: 50 },
        schema: entitlementsListResponseSchema,
      })
      .then((page) =>
        toTicketWalletData(page.items, async (eventId) => {
          const event = await apiClient
            .get({
              path: `/api/v2/public/events/${encodeURIComponent(eventId)}`,
              schema: eventDtoSchema,
            })
            .catch(() => null);
          if (!event) return null;
          const venue = event.venueId
            ? await apiClient
                .get({
                  path: `/api/v2/public/venues/by-id/${event.venueId}`,
                  schema: venueDtoSchema,
                })
                .catch(() => null)
            : null;
          return { event, venue };
        }),
      )
      .then((data) => {
        if (!cancelled) setWallet(data);
      })
      .catch(() => {
        if (!cancelled) setWallet(EMPTY_WALLET);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between">
      {!isAuthenticated ? (
        <TicketsGuestView
          headline={ticketsFixture.headline}
          tagline={ticketsFixture.tagline}
          items={ticketsFixture.items}
        />
      ) : loading ? (
        <div className="relative z-10 mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 py-28 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
            Loading passes
          </p>
        </div>
      ) : (
        <UserTicketsView wallet={wallet ?? EMPTY_WALLET} />
      )}
    </div>
  );
}

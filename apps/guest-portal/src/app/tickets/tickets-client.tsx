'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { useSession } from '@c1rcle/auth';
import {
  entitlementsListResponseSchema,
  managedTicketListSchema,
  managedTicketSchema,
  eventCoverWalletResponseSchema,
  eventDtoSchema,
  ordersListResponseSchema,
  venueDtoSchema,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { bffClient } from '@/lib/bff/bff-client';

import { EventChangeNoticesClient } from '../../features/tickets/components/EventChangeNoticesClient';
import { TicketsGuestView } from '../../features/tickets/components/TicketsGuestView';
import { UserTicketsView } from '../../features/tickets/components/UserTicketsView';
import { toTicketWalletData } from '../../features/tickets/wallet-mapping';

import type { TicketWalletData } from '../../features/tickets/types/tickets.types';
import type { ManagedTicket } from '@c1rcle/contracts';

async function loadPurchasedTickets(): Promise<ManagedTicket[]> {
  const items: ManagedTicket[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const page: { items: ManagedTicket[]; nextCursor: string | null; total: number } =
      await bffClient.get({
        path: '/api/wallet/booking-tickets',
        query: cursor ? { cursor } : {},
        schema: managedTicketListSchema,
        timeoutMs: 15_000,
        retries: 0,
      });
    items.push(...page.items);
    cursor = page.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error('Booking pagination did not advance');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return items;
}

const WALLET_READ_TIMEOUT_MS = 15_000;
const WALLET_ENRICHMENT_TIMEOUT_MS = 10_000;

type WalletState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; wallet: TicketWalletData }
  | { kind: 'error' };

/**
 * Authenticated guests see their real wallet: entitlements from the BFF
 * (`GET /api/wallet/tickets`, session-cookie authenticated) mapped to cards
 * with public event/venue reads. Logged-out visitors get an authentication
 * prompt. A failed wallet read is distinct from a legitimately empty wallet.
 */
export function TicketsClient() {
  const { isAuthenticated, isLoading: isSessionLoading } = useSession();
  const [walletState, setWalletState] = useState<WalletState>({ kind: 'idle' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const retry = useCallback(() => {
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    // Logged-out visitors never reach the wallet fetch.
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (!cancelled) setWalletState({ kind: 'loading' });
        return Promise.all([
          bffClient.get({
            path: '/api/wallet/tickets',
            query: { limit: 50 },
            schema: entitlementsListResponseSchema,
            timeoutMs: WALLET_READ_TIMEOUT_MS,
            retries: 0,
          }),
          bffClient.get({
            path: '/api/wallet/event-covers',
            schema: eventCoverWalletResponseSchema,
            timeoutMs: WALLET_READ_TIMEOUT_MS,
            retries: 0,
          }),
          loadPurchasedTickets(),
          bffClient.get({
            path: '/api/wallet/orders',
            query: { limit: 50 },
            schema: ordersListResponseSchema,
            timeoutMs: WALLET_READ_TIMEOUT_MS,
            retries: 0,
          }),
        ]);
      })
      .then(async ([tickets, eventCovers, purchasedTickets, orders]) => {
        const managedTickets = [...purchasedTickets];
        const known = new Set(managedTickets.map((ticket) => ticket.id));
        const received = tickets.items.filter((ticket) => !known.has(ticket.id));
        for (let index = 0; index < received.length; index += 6) {
          managedTickets.push(
            ...(await Promise.all(
              received.slice(index, index + 6).map((ticket) =>
                bffClient.get({
                  path: `/api/tickets/${encodeURIComponent(ticket.id)}/management`,
                  schema: managedTicketSchema,
                  timeoutMs: WALLET_READ_TIMEOUT_MS,
                  retries: 0,
                }),
              ),
            )),
          );
        }
        return toTicketWalletData(
          tickets.items,
          async (eventId) => {
            const event = await apiClient
              .get({
                path: `/api/v2/public/events/${encodeURIComponent(eventId)}`,
                schema: eventDtoSchema,
                timeoutMs: WALLET_ENRICHMENT_TIMEOUT_MS,
                retries: 0,
              })
              .catch(() => null);
            if (!event) return null;
            const venue = event.venueId
              ? await apiClient
                  .get({
                    path: `/api/v2/public/venues/by-id/${event.venueId}`,
                    schema: venueDtoSchema,
                    timeoutMs: WALLET_ENRICHMENT_TIMEOUT_MS,
                    retries: 0,
                  })
                  .catch(() => null)
              : null;
            return { event, venue };
          },
          new Date(),
          orders.items,
          eventCovers,
          managedTickets,
        );
      })
      .then((data) => {
        if (!cancelled) setWalletState({ kind: 'ready', wallet: data });
      })
      .catch(() => {
        if (!cancelled) setWalletState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadAttempt]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between">
      {isSessionLoading ? (
        <div
          role="status"
          className="relative z-10 mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 py-28 text-center"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
            Checking your session
          </p>
        </div>
      ) : !isAuthenticated ? (
        <TicketsGuestView />
      ) : walletState.kind === 'loading' || walletState.kind === 'idle' ? (
        <div className="relative z-10 mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 py-28 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
            Loading passes
          </p>
        </div>
      ) : walletState.kind === 'error' ? (
        <div className="relative z-10 mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 py-28 text-center text-white">
          <h1 className="text-4xl font-black uppercase tracking-tight">Tickets unavailable</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/50">
            We could not load your wallet. Your tickets have not been removed.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-7 rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-widest text-black"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <EventChangeNoticesClient />
          <UserTicketsView wallet={walletState.wallet} onRefresh={retry} />
        </>
      )}
    </div>
  );
}

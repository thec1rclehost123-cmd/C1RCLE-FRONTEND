import { describe, expect, it } from 'vitest';

import { toTicketWalletData } from './wallet-mapping';

import type { WalletEventDetails } from './wallet-mapping';
import type { EntitlementDto, EventDto, VenueDto } from '@c1rcle/contracts';

const BASE_ENTITLEMENT: EntitlementDto = {
  id: 'ENT-1',
  orderId: 'ORD-1',
  eventId: 'evt_1',
  organizationId: 'org_1',
  tierId: 'tier_1',
  tierName: 'General Admission',
  userId: 'user_1',
  holderName: 'RSVP Guest',
  status: 'valid',
  scanCountAllowed: 1,
  scanCount: 0,
  scannedAt: [],
  version: 1,
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const FUTURE_EVENT: EventDto = {
  id: 'evt_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'future-night',
  title: 'Future Night',
  summary: '',
  description: '',
  imageUrl: 'https://example.com/poster.jpg',
  startAt: '2026-12-25T18:00:00.000Z',
  endAt: '2026-12-26T00:00:00.000Z',
  status: 'published',
  isPublic: true,
  tags: [],
  startingPricePaise: 0,
  isFree: true,
  cancellationReason: null,
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const VENUE: VenueDto = {
  id: 'ven_1',
  organizationId: 'org_1',
  name: 'Sky Bar',
  slug: 'sky-bar',
  status: 'active',
  description: '',
  capacity: null,
  city: 'Mumbai',
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const NOW = new Date('2026-09-23T12:00:00.000Z');

function resolveFor(events: Record<string, EventDto>): (eventId: string) => Promise<WalletEventDetails | null> {
  return (eventId: string) => {
    const event = events[eventId];
    if (!event) return Promise.resolve(null);
    return Promise.resolve({ event, venue: VENUE });
  };
}

describe('toTicketWalletData', () => {
  it('groups one order-tier bundle into a single card with a count', async () => {
    const wallet = await toTicketWalletData(
      [
        BASE_ENTITLEMENT,
        { ...BASE_ENTITLEMENT, id: 'ENT-2' },
        { ...BASE_ENTITLEMENT, id: 'ENT-3', orderId: 'ORD-2', tierId: 'tier_2', tierName: 'VIP' },
      ],
      resolveFor({ evt_1: FUTURE_EVENT }),
      NOW,
    );

    expect(wallet.upcomingTickets).toHaveLength(2);
    expect(wallet.upcomingTickets[0]).toMatchObject({
      orderId: 'ORD-1',
      tierName: 'General Admission',
      ticketCount: 2,
      status: 'active',
      eventTitle: 'Future Night',
      venueName: 'Sky Bar',
      city: 'Mumbai',
    });
    expect(wallet.pastTickets).toHaveLength(0);
  });

  it('sends redeemed, void, and ended events to history', async () => {
    const endedEvent: EventDto = { ...FUTURE_EVENT, id: 'evt_past', endAt: '2026-01-02T00:00:00.000Z' };
    const wallet = await toTicketWalletData(
      [
        { ...BASE_ENTITLEMENT, id: 'ENT-used', status: 'redeemed', scanCount: 1 },
        { ...BASE_ENTITLEMENT, id: 'ENT-void', orderId: 'ORD-void', status: 'void' },
        {
          ...BASE_ENTITLEMENT,
          id: 'ENT-ended',
          orderId: 'ORD-ended',
          eventId: 'evt_past',
        },
      ],
      resolveFor({ evt_1: FUTURE_EVENT, evt_past: endedEvent }),
      NOW,
    );

    expect(wallet.upcomingTickets).toHaveLength(0);
    expect(wallet.pastTickets.map((ticket) => ticket.status)).toEqual([
      'used',
      'cancelled',
      'active',
    ]);
  });

  it('skips entitlements whose event no longer resolves', async () => {
    const wallet = await toTicketWalletData([BASE_ENTITLEMENT], resolveFor({}), NOW);

    expect(wallet.upcomingTickets).toHaveLength(0);
    expect(wallet.pastTickets).toHaveLength(0);
  });
});

import { describe, expect, it } from 'vitest';

import { toTicketWalletData } from './wallet-mapping';

import type { WalletEventDetails } from './wallet-mapping';
import type {
  EntitlementDto,
  EventCoverWalletItemDto,
  EventDto,
  OrderDto,
  VenueDto,
} from '@c1rcle/contracts';

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
  visibilityMode: 'public',
  addressDisclosure: 'public',
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

const ORDER: OrderDto = {
  id: 'ORD-1',
  bookingReference: 'C1-ABCDE-F1234-56789-ABCDE',
  eventId: 'evt_1',
  organizationId: 'org_1',
  userId: 'user_1',
  status: 'paid',
  lines: [
    {
      tierId: 'tier_1',
      tierName: 'General Admission',
      quantity: 2,
      unitPricePaise: 1000,
      subtotalPaise: 2000,
    },
  ],
  currency: 'INR',
  subtotalPaise: 2000,
  discountPaise: 0,
  discountedSubtotalPaise: 2000,
  platformFeePaise: 0,
  paymentFeePaise: 0,
  gstPaise: 0,
  grandTotalPaise: 2000,
  appliedPromoCode: null,
  paymentIntentId: 'provider_order_1',
  paymentId: 'provider_payment_1',
  paidAt: '2026-09-23T00:00:00.000Z',
  reservationExpiresAt: '2026-09-23T00:15:00.000Z',
  failureReason: null,
  eventCancellation: null,
  refundedPaise: 0,
  version: 1,
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

function resolveFor(
  events: Record<string, EventDto>,
): (eventId: string) => Promise<WalletEventDetails | null> {
  return (eventId: string) => {
    const event = events[eventId];
    if (!event) return Promise.resolve(null);
    return Promise.resolve({ event, venue: VENUE });
  };
}

describe('toTicketWalletData', () => {
  it('resolves distinct event details concurrently', async () => {
    const eventIds = ['evt_1', 'evt_2'];
    const started: string[] = [];
    const release: Record<string, (details: WalletEventDetails | null) => void> = {};
    const pending = toTicketWalletData(
      [BASE_ENTITLEMENT, { ...BASE_ENTITLEMENT, id: 'ENT-2', orderId: 'ORD-2', eventId: 'evt_2' }],
      (eventId) => {
        started.push(eventId);
        return new Promise((resolve) => {
          release[eventId] = resolve;
        });
      },
      NOW,
    );

    await Promise.resolve();
    expect(started).toEqual(eventIds);

    release['evt_1']?.({ event: FUTURE_EVENT, venue: VENUE });
    release['evt_2']?.({ event: { ...FUTURE_EVENT, id: 'evt_2' }, venue: VENUE });
    const wallet = await pending;
    expect(wallet.upcomingTickets).toHaveLength(2);
  });

  it('keeps every entitlement as an independently scannable ticket card', async () => {
    const wallet = await toTicketWalletData(
      [
        BASE_ENTITLEMENT,
        { ...BASE_ENTITLEMENT, id: 'ENT-2' },
        { ...BASE_ENTITLEMENT, id: 'ENT-3', orderId: 'ORD-2', tierId: 'tier_2', tierName: 'VIP' },
      ],
      resolveFor({ evt_1: FUTURE_EVENT }),
      NOW,
    );

    expect(wallet.upcomingTickets).toHaveLength(3);
    expect(wallet.upcomingTickets[0]).toMatchObject({
      orderId: 'ORD-1',
      tierName: 'General Admission',
      ticketCount: 1,
      status: 'active',
      eventTitle: 'Future Night',
      venueName: 'Sky Bar',
      city: 'Mumbai',
    });
    expect(new Set(wallet.upcomingTickets.map((ticket) => ticket.id))).toEqual(
      new Set(['ENT-1', 'ENT-2', 'ENT-3']),
    );
    expect(wallet.pastTickets).toHaveLength(0);
  });

  it('labels unassigned group admissions as held in the purchaser custody', async () => {
    const wallet = await toTicketWalletData(
      [{ ...BASE_ENTITLEMENT, id: 'ENT-unassigned', currentHolderUserId: null, holderName: '' }],
      resolveFor({ evt_1: FUTURE_EVENT }),
      NOW,
    );

    expect(wallet.upcomingTickets[0]).toMatchObject({
      id: 'ENT-unassigned',
      holderName: 'Unassigned · in your custody',
      custody: 'unassigned',
      ticketCount: 1,
    });
  });

  it('sends redeemed, void, and ended events to history', async () => {
    const endedEvent: EventDto = {
      ...FUTURE_EVENT,
      id: 'evt_past',
      endAt: '2026-01-02T00:00:00.000Z',
    };
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

  it('keeps an unavailable record when event details no longer resolve', async () => {
    const wallet = await toTicketWalletData([BASE_ENTITLEMENT], resolveFor({}), NOW);

    expect(wallet.upcomingTickets).toHaveLength(0);
    expect(wallet.pastTickets).toHaveLength(1);
    expect(wallet.pastTickets[0]).toMatchObject({
      status: 'unavailable',
      eventTitle: 'Event details unavailable',
    });
  });

  it('shows authoritative cancellation even after the public event disappears', async () => {
    const wallet = await toTicketWalletData([BASE_ENTITLEMENT], resolveFor({}), NOW, [
      {
        ...ORDER,
        eventCancellation: {
          eventVersion: 5,
          eventTitle: 'Future Night',
          reason: 'Venue closed',
          cancelledAt: '2026-09-23T08:00:00.000Z',
        },
      },
    ]);

    expect(wallet.pastTickets[0]).toMatchObject({
      status: 'cancelled',
      eventTitle: 'Future Night',
      bookingReference: ORDER.bookingReference,
    });
  });

  it('preserves unaffected tickets after a partial ticket refund', async () => {
    const wallet = await toTicketWalletData(
      [BASE_ENTITLEMENT, { ...BASE_ENTITLEMENT, id: 'ENT-void', status: 'void' }],
      resolveFor({ evt_1: FUTURE_EVENT }),
      NOW,
      [{ ...ORDER, refundedPaise: 1000 }],
    );

    expect(wallet.upcomingTickets).toHaveLength(1);
    expect(wallet.upcomingTickets[0]).toMatchObject({
      status: 'active',
      ticketCount: 1,
      bookingReference: ORDER.bookingReference,
    });
    expect(wallet.pastTickets).toHaveLength(1);
    expect(wallet.pastTickets[0]).toMatchObject({ status: 'refunded', ticketCount: 1 });
  });

  it('keeps refund-locked tickets out of current passes', async () => {
    const wallet = await toTicketWalletData(
      [BASE_ENTITLEMENT],
      resolveFor({ evt_1: FUTURE_EVENT }),
      NOW,
      [{ ...ORDER, status: 'refund_requested' }],
    );

    expect(wallet.upcomingTickets).toHaveLength(0);
    expect(wallet.pastTickets[0]).toMatchObject({
      status: 'refund_pending',
      ticketCount: 1,
      bookingReference: ORDER.bookingReference,
    });
  });

  it('attaches the caller-held per-ticket cover balance and history to its wallet pass', async () => {
    const cover: EventCoverWalletItemDto = {
      entitlementId: BASE_ENTITLEMENT.id,
      eventId: BASE_ENTITLEMENT.eventId,
      status: 'pending_activation',
      issuedPaise: 15_000,
      remainingPaise: 15_000,
      reservedPaise: 0,
      redeemedPaise: 0,
      refundedPaise: 0,
      policyVersion: 'venue-v1',
      history: [{ type: 'issuance', amountPaise: 15_000, createdAt: '2026-09-23T00:00:00.000Z' }],
    };
    const wallet = await toTicketWalletData(
      [BASE_ENTITLEMENT],
      resolveFor({ evt_1: FUTURE_EVENT }),
      NOW,
      [],
      [cover],
    );

    expect(wallet.upcomingTickets[0]?.eventCover).toMatchObject({
      status: 'pending_activation',
      issuedPaise: 15_000,
      remainingPaise: 15_000,
      history: [{ type: 'issuance', amountPaise: 15_000 }],
    });
  });

  it('projects purchased add-on grant status into the matching ticket wallet item', async () => {
    const entitlement: EntitlementDto = {
      ...BASE_ENTITLEMENT,
      ticketAddons: [
        {
          id: 'TAE-parking-1',
          addonId: 'addon-parking',
          name: 'Parking pass',
          kind: 'parking',
          unitPricePaise: 2500,
          status: 'active',
          createdAt: '2026-09-23T00:00:00.000Z',
          redeemedAt: null,
        },
      ],
    };
    const wallet = await toTicketWalletData(
      [entitlement],
      resolveFor({ evt_1: FUTURE_EVENT }),
      NOW,
    );
    expect(wallet.upcomingTickets[0]?.ticketAddons).toEqual([
      { id: 'TAE-parking-1', name: 'Parking pass', kind: 'parking', status: 'active' },
    ]);
  });
});

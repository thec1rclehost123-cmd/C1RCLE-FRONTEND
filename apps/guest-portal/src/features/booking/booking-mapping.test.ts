import { describe, expect, it } from 'vitest';

import { toBookingEventFromPublicDetail, toBookingEventFixture } from './booking-mapping';

import type {
  EventDto,
  EventPublicDetailDto,
  PublicTicketTierDto,
  VenueDto,
} from '@c1rcle/contracts';

const EVENT: EventDto = {
  id: 'evt_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'sky-night',
  title: 'Sky Night',
  summary: 'A rooftop gathering.',
  description: '',
  imageUrl: 'https://example.com/poster.jpg',
  startAt: '2026-09-18T19:30:00.000Z',
  endAt: null,
  status: 'published',
  visibilityMode: 'public',
  addressDisclosure: 'public',
  isPublic: true,
  tags: ['Music'],
  startingPricePaise: 120000,
  isFree: false,
  cancellationReason: null,
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const VENUE: VenueDto = {
  id: 'ven_1',
  organizationId: 'org_1',
  name: 'Skyline Social',
  slug: 'skyline-social',
  status: 'active',
  description: '',
  capacity: null,
  city: 'Pune',
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const PUBLIC_EVENT: EventPublicDetailDto = {
  ...EVENT,
  venue: {
    id: 'ven_1',
    name: 'Skyline Social',
    slug: 'skyline-social',
    photoUrl: null,
    address: { city: 'Pune', country: 'India' },
  },
  organizer: null,
};

describe('toBookingEventFixture', () => {
  it('maps wire fields into the checkout view model', () => {
    expect(toBookingEventFixture(EVENT, VENUE, [])).toEqual({
      id: 'sky-night',
      eventId: 'evt_1',
      title: 'Sky Night',
      category: 'Music',
      image: 'https://example.com/poster.jpg',
      accentTone: 'purple',
      startsAt: '2026-09-18T19:30:00.000Z',
      venue: 'Skyline Social',
      address: 'Pune',
      city: 'Pune',
      doorNote: 'Entry rules are set by the host and shown at checkout.',
      ticketTiers: [],
      ticketAddons: [],
      purchasable: false,
    });
  });

  it('is purchasable only when authoritative inventory is available', () => {
    expect(toBookingEventFixture(EVENT, VENUE, []).purchasable).toBe(false);
    expect(
      toBookingEventFixture(EVENT, VENUE, [
        {
          id: 'tier_1',
          eventId: EVENT.id,
          name: 'General',
          description: '',
          priceInPaise: 120000,
          currency: 'INR',
          availableQuantity: 1,
        },
      ]).purchasable,
    ).toBe(true);
  });

  it('leaves missing event artwork empty and uses honest venue placeholders', () => {
    const mapped = toBookingEventFixture(
      { ...EVENT, tags: [], imageUrl: null, summary: '' },
      null,
      [],
    );
    expect(mapped).toMatchObject({
      category: 'Events',
      image: '',
      venue: 'Venue TBA',
      city: 'India',
      ticketTiers: [],
    });
  });

  it('maps real public tiers with their ids (RSVP-capable)', () => {
    const tiers: PublicTicketTierDto[] = [
      {
        id: 'tier_rsvp_1',
        eventId: 'evt_1',
        name: 'RSVP Entry',
        description: 'Free entry',
        priceInPaise: 0,
        currency: 'INR',
        availableQuantity: 40,
      },
      {
        id: 'tier_vip_1',
        eventId: 'evt_1',
        name: 'VIP',
        description: 'Priority entry',
        priceInPaise: 200000,
        currency: 'INR',
        availableQuantity: 3,
        guestCount: 3,
        admissionMode: 'per_person',
        coverAmountPaise: 1500,
      },
    ];
    const mapped = toBookingEventFixture(EVENT, VENUE, tiers);
    expect(mapped.ticketTiers).toEqual([
      {
        id: 'tier_rsvp_1',
        name: 'RSVP Entry',
        description: 'Free entry',
        price: { amountPaise: 0, currency: 'INR' },
        basePrice: { amountPaise: 0, currency: 'INR' },
        maximumQuantity: 1,
      },
      {
        id: 'tier_vip_1',
        name: 'VIP',
        description: 'Priority entry',
        price: { amountPaise: 200000, currency: 'INR' },
        basePrice: { amountPaise: 200000, currency: 'INR' },
        coverAmountPaise: 1500,
        maximumQuantity: 3,
        guestCount: 3,
        admissionMode: 'per_person',
      },
    ]);
  });

  it('caps sold-out real tiers at zero so the stepper cannot select them', () => {
    const mapped = toBookingEventFixture(EVENT, VENUE, [
      {
        id: 'tier_soldout_1',
        eventId: 'evt_1',
        name: 'RSVP Entry',
        description: '',
        priceInPaise: 0,
        currency: 'INR',
        availableQuantity: 0,
      },
    ]);
    expect(mapped.ticketTiers[0]?.maximumQuantity).toBe(0);
  });

  it('respects the tier per-order limit below the display safety cap', () => {
    const mapped = toBookingEventFixture(EVENT, VENUE, [
      {
        id: 'tier_limited',
        eventId: 'evt_1',
        name: 'General',
        description: '',
        priceInPaise: 80_000,
        currency: 'INR',
        availableQuantity: 80,
        maxPerOrder: 4,
      },
    ]);
    expect(mapped.ticketTiers[0]).toMatchObject({ maximumQuantity: 4, maxPerOrder: 4 });
  });

  it('uses the contract maximum when no smaller per-order limit is configured', () => {
    const mapped = toBookingEventFixture(EVENT, VENUE, [
      {
        id: 'tier_unlimited',
        eventId: EVENT.id,
        name: 'General',
        description: '',
        priceInPaise: 80_000,
        currency: 'INR',
        availableQuantity: 120,
      },
    ]);
    expect(mapped.ticketTiers[0]?.maximumQuantity).toBe(100);
  });

  it('maps early bird base/current prices and prevents unavailable tiers from selection', () => {
    const mapped = toBookingEventFixture(EVENT, VENUE, [
      {
        id: 'tier_early',
        eventId: EVENT.id,
        name: 'General',
        description: '',
        priceInPaise: 65_000,
        basePriceInPaise: 80_000,
        availabilityStatus: 'available',
        pricingPhase: {
          name: 'Early Bird',
          startsAt: '2026-11-16T00:00:00.000Z',
          endsAt: '2026-11-22T00:00:00.000Z',
          availableQuantity: 20,
        },
        currency: 'INR',
        availableQuantity: 20,
      },
      {
        id: 'tier_future',
        eventId: EVENT.id,
        name: 'VIP',
        description: '',
        priceInPaise: 180_000,
        basePriceInPaise: 180_000,
        availabilityStatus: 'not_yet_available',
        pricingPhase: null,
        currency: 'INR',
        availableQuantity: 15,
      },
    ]);
    expect(mapped.ticketTiers[0]).toMatchObject({
      price: { amountPaise: 65_000 },
      basePrice: { amountPaise: 80_000 },
      pricingPhase: { name: 'Early Bird' },
      maximumQuantity: 20,
    });
    expect(mapped.ticketTiers[1]?.maximumQuantity).toBe(0);
  });
});

describe('toBookingEventFromPublicDetail', () => {
  it('uses the detail route event and live tier identifiers for overlay checkout', () => {
    const mapped = toBookingEventFromPublicDetail(PUBLIC_EVENT, [
      {
        id: 'tier_live_1',
        eventId: EVENT.id,
        name: 'General Admission',
        description: 'Entry',
        priceInPaise: 120_000,
        currency: 'INR',
        availableQuantity: 7,
      },
    ]);

    expect(mapped).toMatchObject({
      eventId: EVENT.id,
      title: EVENT.title,
      venue: 'Skyline Social',
      city: 'Pune',
      purchasable: true,
      ticketTiers: [
        {
          id: 'tier_live_1',
          price: { amountPaise: 120_000, currency: 'INR' },
          maximumQuantity: 7,
        },
      ],
    });
  });
});

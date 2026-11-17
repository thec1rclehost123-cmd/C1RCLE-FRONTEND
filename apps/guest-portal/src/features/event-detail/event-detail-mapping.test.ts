import { describe, expect, it } from 'vitest';

import { formatEventDateTimeRange, toEventDetailFixture } from './event-detail-mapping';

import type { EventPublicDetailDto, PublicTicketTierDto } from '@c1rcle/contracts';

const EVENT: EventPublicDetailDto = {
  id: 'evt_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'sky-night',
  title: 'Sky Night',
  summary: 'A rooftop gathering.',
  description: 'Doors at 7pm.',
  imageUrl: 'https://example.com/poster.jpg',
  startAt: '2026-09-18T19:30:00.000Z',
  endAt: '2026-09-18T23:30:00.000Z',
  status: 'published',
  visibilityMode: 'public',
  addressDisclosure: 'public',
  isPublic: true,
  tags: ['Music'],
  startingPricePaise: 99_900,
  isFree: false,
  cancellationReason: null,
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  venue: {
    id: 'ven_1',
    name: 'Skyline Social',
    slug: 'skyline-social',
    photoUrl: null,
    address: { street: '12 Hill Road', city: 'Pune', state: 'Maharashtra', country: 'India' },
  },
  organizer: { id: 'org_1', name: 'Seed Host', slug: 'seed-host' },
};

const TIERS: PublicTicketTierDto[] = [
  {
    id: 'tier_real',
    eventId: EVENT.id,
    name: 'Early Entry',
    description: 'Entry before 9pm',
    priceInPaise: 99_900,
    currency: 'INR',
    availableQuantity: 8,
  },
];

describe('toEventDetailFixture', () => {
  it('formats both event start and end times in India time', () => {
    expect(formatEventDateTimeRange('2026-11-29T12:30:00.000Z', '2026-11-29T16:30:00.000Z')).toBe(
      '29 Nov 2026, 6:00 pm – 29 Nov 2026, 10:00 pm',
    );
  });

  it('preserves saved event media for the guest event page', () => {
    const media = {
      youtubeUrl: 'https://youtu.be/abc123',
      gallery: [{ url: 'https://example.test/image.jpg', alt: 'Gallery' }],
      spotlights: [],
    };
    expect(toEventDetailFixture({ ...EVENT, media }, TIERS).media).toEqual(media);
  });

  it('uses authoritative sales state for finished and sold-out event presentation', () => {
    expect(toEventDetailFixture({ ...EVENT, salesStatus: 'ended' }, []).lifecycle).toBe(
      'completed',
    );
    expect(toEventDetailFixture({ ...EVENT, salesStatus: 'sold_out' }, []).lifecycle).toBe(
      'sold_out',
    );
  });

  it('maps the public relationship projection and exact tier identity', () => {
    const mapped = toEventDetailFixture(EVENT, TIERS);
    expect(mapped).toMatchObject({
      id: 'evt_1',
      slug: 'sky-night',
      title: 'Sky Night',
      category: 'Music',
      image: 'https://example.com/poster.jpg',
      startsAt: '2026-09-18T19:30:00.000Z',
      endsAt: '2026-09-18T23:30:00.000Z',
      venue: 'Skyline Social',
      venueId: 'skyline-social',
      city: 'Pune',
      host: 'Seed Host',
      hostId: 'seed-host',
      lifecycle: 'scheduled',
      guests: [],
      interestedCount: 0,
      ticketNote: 'Live availability',
    });
    expect(mapped.address).toBe('12 Hill Road, Pune, Maharashtra, India');
    expect(mapped.ticketTiers).toEqual([
      {
        id: 'tier_real',
        name: 'Early Entry',
        description: 'Entry before 9pm',
        price: { amountPaise: 99_900, currency: 'INR' },
        basePrice: { amountPaise: 99_900, currency: 'INR' },
        availabilityLabel: '8 available',
        availableQuantity: 8,
      },
    ]);
  });

  it('preserves sold-out and free tier truth', () => {
    const mapped = toEventDetailFixture(EVENT, [
      { ...TIERS[0]!, priceInPaise: 0, availableQuantity: 0 },
    ]);
    expect(mapped.ticketTiers[0]).toMatchObject({
      price: null,
      availabilityLabel: 'Sold out',
      availableQuantity: 0,
    });
  });

  it('maps phase, base price, and distinct unavailable reasons', () => {
    const mapped = toEventDetailFixture(EVENT, [
      {
        ...TIERS[0]!,
        priceInPaise: 65_000,
        basePriceInPaise: 80_000,
        availabilityStatus: 'available',
        pricingPhase: {
          name: 'Early Bird',
          startsAt: '2026-11-16T00:00:00.000Z',
          endsAt: '2026-11-22T00:00:00.000Z',
          availableQuantity: 20,
        },
      },
      {
        ...TIERS[0]!,
        id: 'tier_future',
        availabilityStatus: 'not_yet_available',
        availableQuantity: 20,
      },
    ]);
    expect(mapped.ticketTiers[0]).toMatchObject({
      price: { amountPaise: 65_000 },
      basePrice: { amountPaise: 80_000 },
      pricingPhase: { name: 'Early Bird' },
    });
    expect(mapped.ticketTiers[1]).toMatchObject({
      availabilityLabel: 'Not on sale yet',
      availabilityStatus: 'not_yet_available',
    });
  });

  it('maps paused and cancelled statuses to their lifecycles', () => {
    expect(toEventDetailFixture({ ...EVENT, status: 'sales_paused' }, TIERS).lifecycle).toBe(
      'paused',
    );
    expect(toEventDetailFixture({ ...EVENT, status: 'cancelled' }, TIERS).lifecycle).toBe(
      'cancelled',
    );
  });

  it('maps a public external location without inventing a Venue profile', () => {
    const mapped = toEventDetailFixture(
      {
        ...EVENT,
        venueId: null,
        venue: null,
        externalLocation: {
          name: 'Independent Hall',
          address: '12 Example Road',
          city: 'Pune',
          mapUrl: 'https://maps.example.test/hall',
        },
      },
      TIERS,
    );
    expect(mapped).toMatchObject({
      venue: 'Independent Hall',
      venueId: null,
      address: '12 Example Road',
      city: 'Pune',
      mapUrl: 'https://maps.example.test/hall',
    });
  });

  it('keeps missing relationships and content visibly unavailable', () => {
    const mapped = toEventDetailFixture(
      {
        ...EVENT,
        tags: [],
        imageUrl: null,
        endAt: null,
        summary: '',
        description: '',
        venue: null,
        organizer: null,
      },
      [],
    );
    expect(mapped).toMatchObject({
      category: 'Events',
      image: '/c1rcle-logo.webp',
      venue: 'Venue TBA',
      venueId: null,
      city: 'Location unavailable',
      host: '',
      hostId: null,
      endsAt: EVENT.startAt,
      summary: 'Event details not provided.',
      ticketTiers: [],
    });
    expect(mapped.description).toEqual([]);
  });
});

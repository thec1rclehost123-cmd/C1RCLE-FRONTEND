import { describe, expect, it } from 'vitest';

import { deriveCities, toCityKey, toExploreEvent } from './explore-mapping';

import type { EventDto, PublicTicketTierDto, VenueDto } from '@c1rcle/contracts';

const EVENT: EventDto = {
  id: 'evt_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'sky-night',
  title: 'Sky Night',
  summary: '',
  description: '',
  imageUrl: 'https://example.com/poster.jpg',
  startAt: '2026-09-18T19:30:00.000Z',
  endAt: null,
  status: 'published',
  visibilityMode: 'public',
  addressDisclosure: 'public',
  isPublic: true,
  tags: ['Music', 'Live'],
  startingPricePaise: 99900,
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

const TIERS: PublicTicketTierDto[] = [
  {
    id: 'tier_1',
    eventId: EVENT.id,
    name: 'General',
    description: '',
    priceInPaise: 99900,
    currency: 'INR',
    availableQuantity: 8,
  },
];

describe('toExploreEvent', () => {
  it('maps wire fields, paise, and ISO timestamps untouched', () => {
    expect(toExploreEvent(EVENT, VENUE, TIERS)).toEqual({
      id: 'evt_1',
      slug: 'sky-night',
      title: 'Sky Night',
      category: 'Music',
      image: 'https://example.com/poster.jpg',
      startsAt: '2026-09-18T19:30:00.000Z',
      venueId: 'ven_1',
      venueSlug: 'skyline-social',
      venue: 'Skyline Social',
      city: 'Pune',
      cityKey: 'pune',
      price: { amountPaise: 99900, currency: 'INR' },
      isFree: false,
      summary: '',
      availability: 'available',
      availableQuantity: 8,
    });
  });

  it('falls back honestly without inventing data', () => {
    expect(toExploreEvent({ ...EVENT, tags: [], imageUrl: null }, null, null)).toMatchObject({
      category: 'Events',
      image: '/c1rcle-logo.webp',
      venue: 'Venue TBA',
      city: 'Location unavailable',
      cityKey: '',
      venueId: 'ven_1',
      venueSlug: null,
      availability: 'unavailable',
    });
  });

  it('maps free events to a null price', () => {
    expect(
      toExploreEvent({ ...EVENT, isFree: true }, VENUE, [{ ...TIERS[0]!, priceInPaise: 0 }]).price,
    ).toBeNull();
    expect(toExploreEvent({ ...EVENT, isFree: true }, VENUE, TIERS).isFree).toBe(true);
  });

  it('keeps a missing price distinct from an explicitly free event', () => {
    const event = toExploreEvent(EVENT, VENUE, null);
    expect(event.price).toBeNull();
    expect(event.isFree).toBe(false);
  });

  it('distinguishes sold out from unavailable inventory', () => {
    expect(
      toExploreEvent(EVENT, VENUE, [{ ...TIERS[0]!, availableQuantity: 0 }]).availability,
    ).toBe('sold-out');
    expect(toExploreEvent(EVENT, VENUE, []).availability).toBe('unavailable');
  });
});

describe('toCityKey', () => {
  it('lowercases and strips separators', () => {
    expect(toCityKey('Mumbai')).toBe('mumbai');
    expect(toCityKey('New Delhi')).toBe('newdelhi');
  });
});

describe('deriveCities', () => {
  it('always starts with All Cities and dedupes by key', () => {
    const events = [toExploreEvent(EVENT, VENUE, TIERS), toExploreEvent(EVENT, VENUE, TIERS)];
    expect(deriveCities(events)).toEqual([
      { label: 'All Cities', value: '' },
      { label: 'Pune', value: 'pune' },
    ]);
    expect(deriveCities([])).toEqual([{ label: 'All Cities', value: '' }]);
  });
});

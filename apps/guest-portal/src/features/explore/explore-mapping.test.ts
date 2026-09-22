import { describe, expect, it } from 'vitest';

import { deriveCities, toCityKey, toExploreEvent } from './explore-mapping';

import type { EventDto, VenueDto } from '@c1rcle/contracts';


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

describe('toExploreEvent', () => {
  it('maps wire fields, paise, and ISO timestamps untouched', () => {
    expect(toExploreEvent(EVENT, VENUE)).toEqual({
      id: 'evt_1',
      slug: 'sky-night',
      title: 'Sky Night',
      category: 'Music',
      image: 'https://example.com/poster.jpg',
      startsAt: '2026-09-18T19:30:00.000Z',
      venue: 'Skyline Social',
      city: 'Pune',
      cityKey: 'pune',
      price: { amountPaise: 99900, currency: 'INR' },
    });
  });

  it('falls back honestly without inventing data', () => {
    expect(toExploreEvent({ ...EVENT, tags: [], imageUrl: null }, null)).toMatchObject({
      category: 'Events',
      image: '/c1rcle-logo.webp',
      venue: 'Venue TBA',
      city: 'India',
      cityKey: 'india',
    });
  });

  it('maps free events to a null price', () => {
    expect(toExploreEvent({ ...EVENT, isFree: true }, VENUE).price).toBeNull();
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
    const events = [toExploreEvent(EVENT, VENUE), toExploreEvent(EVENT, VENUE)];
    expect(deriveCities(events)).toEqual([
      { label: 'All Cities', value: '' },
      { label: 'Pune', value: 'pune' },
    ]);
    expect(deriveCities([])).toEqual([{ label: 'All Cities', value: '' }]);
  });
});

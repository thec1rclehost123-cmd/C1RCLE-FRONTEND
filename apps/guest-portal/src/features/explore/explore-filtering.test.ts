import { describe, expect, it } from 'vitest';

import { deriveCategories, filterExploreEvents, filtersToQuery } from './explore-filtering';

import type { ExploreEvent, ExploreFilters } from './types/explore.types';

const BASE_FILTERS: ExploreFilters = {
  search: '',
  city: '',
  category: '',
  date: 'any',
  sort: 'soonest',
};

const EVENTS: ExploreEvent[] = [
  {
    id: 'evt_1',
    slug: 'pune-jazz',
    title: 'Pune Jazz Night',
    category: 'Music',
    image: '/jazz.webp',
    startsAt: '2026-10-17T14:30:00.000Z',
    venue: 'Blue Room',
    city: 'Pune',
    cityKey: 'pune',
    venueId: null,
    venueSlug: null,
    price: { amountPaise: 120_000, currency: 'INR' },
    availability: 'sold-out',
    availableQuantity: 0,
  },
  {
    id: 'evt_2',
    slug: 'mumbai-design',
    title: 'Design Assembly',
    category: 'Conference',
    image: '/design.webp',
    startsAt: '2026-10-18T05:30:00.000Z',
    venue: 'Dock Hall',
    city: 'Mumbai',
    cityKey: 'mumbai',
    venueId: null,
    venueSlug: null,
    price: { amountPaise: 80_000, currency: 'INR' },
    availability: 'available',
    availableQuantity: 20,
  },
];

describe('filterExploreEvents', () => {
  it('combines search, city, and category filters', () => {
    expect(
      filterExploreEvents(EVENTS, {
        ...BASE_FILTERS,
        search: 'blue',
        city: 'pune',
        category: 'Music',
      }),
    ).toEqual([EVENTS[0]]);
  });

  it('filters today and the upcoming weekend in the product timezone', () => {
    const fridayInIndia = new Date('2026-10-16T06:30:00.000Z');
    expect(
      filterExploreEvents(
        [{ ...EVENTS[0]!, startsAt: '2026-10-16T14:30:00.000Z' }, EVENTS[1]!],
        { ...BASE_FILTERS, date: 'today' },
        fridayInIndia,
      ),
    ).toHaveLength(1);
    expect(
      filterExploreEvents(EVENTS, { ...BASE_FILTERS, date: 'weekend' }, fridayInIndia),
    ).toEqual(EVENTS);
  });

  it('sorts by soonest, newest, and lowest price without claiming trending data', () => {
    expect(
      filterExploreEvents(EVENTS, { ...BASE_FILTERS, sort: 'soonest' }).map(({ id }) => id),
    ).toEqual(['evt_1', 'evt_2']);
    expect(
      filterExploreEvents(EVENTS, { ...BASE_FILTERS, sort: 'price-low' }).map(({ id }) => id),
    ).toEqual(['evt_2', 'evt_1']);
    expect(
      filterExploreEvents(EVENTS, { ...BASE_FILTERS, sort: 'newest' }).map(({ id }) => id),
    ).toEqual(['evt_2', 'evt_1']);
    expect(filterExploreEvents(EVENTS, BASE_FILTERS).map(({ id }) => id)).toEqual([
      'evt_1',
      'evt_2',
    ]);
  });
});

describe('explore filter metadata', () => {
  it('derives unique sorted categories', () => {
    expect(deriveCategories([...EVENTS, EVENTS[0]!])).toEqual(['Conference', 'Music']);
  });

  it('persists only active filters in the URL', () => {
    expect(
      filtersToQuery({
        search: 'jazz',
        city: 'pune',
        category: 'Music',
        date: 'weekend',
        sort: 'soonest',
      }),
    ).toBe('q=jazz&city=pune&category=Music&date=weekend');
    expect(filtersToQuery(BASE_FILTERS)).toBe('');
  });
});

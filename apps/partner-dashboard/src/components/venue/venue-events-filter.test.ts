import { describe, expect, it } from 'vitest';

import { filterVenueEvents } from './venue-events-filter';
import { EVENTS } from './venue-events-model';

describe('filterVenueEvents', () => {
  it('combines search, status, venue, and month filters', () => {
    expect(
      filterVenueEvents(EVENTS, {
        tab: 'upcoming',
        query: 'sunset',
        status: 'Confirmed',
        venue: 'Aurus, Lower Parel',
        month: '2025-05',
      }).map((event) => event.id),
    ).toEqual(['sunset-sessions-vol-4']);
  });

  it('keeps live and confirmed statuses distinct', () => {
    const live = filterVenueEvents(EVENTS, {
      tab: 'live',
      query: '',
      status: 'Live',
      venue: 'all',
      month: 'all',
    });
    expect(live).toHaveLength(2);
    expect(live.every((event) => event.status === 'Live')).toBe(true);
  });

  it('groups upcoming, live, drafts, and past events with plain status rules', () => {
    const filters = { query: '', status: 'all', venue: 'all', month: 'all' } as const;

    expect(filterVenueEvents(EVENTS, { ...filters, tab: 'upcoming' })).toHaveLength(5);
    expect(filterVenueEvents(EVENTS, { ...filters, tab: 'live' })).toHaveLength(2);
    expect(filterVenueEvents(EVENTS, { ...filters, tab: 'drafts' })).toHaveLength(1);
    expect(filterVenueEvents(EVENTS, { ...filters, tab: 'past' })).toHaveLength(0);
  });
});

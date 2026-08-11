import { describe, expect, it } from 'vitest';

import { filterVenueEvents } from './venue-events-filter';
import { EVENTS } from './venue-events-model';

describe('filterVenueEvents', () => {
  it('combines search, status, venue, and month filters', () => {
    expect(
      filterVenueEvents(EVENTS, {
        query: 'sunset',
        status: 'Confirmed',
        venue: 'Aurus, Lower Parel',
        month: '2025-05',
      }).map((event) => event.id),
    ).toEqual(['sunset-sessions-vol-4']);
  });

  it('keeps live and confirmed statuses distinct', () => {
    const live = filterVenueEvents(EVENTS, {
      query: '',
      status: 'Live',
      venue: 'all',
      month: 'all',
    });
    expect(live).toHaveLength(2);
    expect(live.every((event) => event.status === 'Live')).toBe(true);
  });
});

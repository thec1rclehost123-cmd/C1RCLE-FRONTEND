import { describe, expect, it } from 'vitest';

import {
  calendarMonthKeys,
  mapVenueCalendar,
  venueBlockTimeRange,
} from './venue-calendar-repository';

import type { EventDto, VenueDto, VenueSlotDto } from '@c1rcle/contracts';

const timestamp = '2026-09-01T00:00:00.000Z';
const venue: VenueDto = {
  id: 'venue-1',
  organizationId: 'org-1',
  name: 'The Circle Room',
  slug: 'the-circle-room',
  status: 'active',
  description: '',
  capacity: 300,
  city: 'Mumbai',
  version: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
};

function slot(id: string, day: number, status: VenueSlotDto['status']): VenueSlotDto {
  const date = `2026-09-${String(day).padStart(2, '0')}`;
  return {
    id,
    venueId: venue.id,
    label: `${status} night`,
    startTime: `${date}T20:00:00.000Z`,
    endTime: `${date}T23:30:00.000Z`,
    recurring: false,
    status,
    capacityFor: null,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function event(id: string, day: number, status: EventDto['status']): EventDto {
  const date = `2026-09-${String(day).padStart(2, '0')}`;
  return {
    id,
    organizationId: venue.organizationId,
    venueId: venue.id,
    slug: `event-${id}`,
    title: `Event ${id}`,
    summary: '',
    description: '',
    imageUrl: null,
    startAt: `${date}T21:00:00.000Z`,
    endAt: `${date}T23:00:00.000Z`,
    status,
    isPublic: true,
    tags: [],
    startingPricePaise: null,
    isFree: false,
    cancellationReason: null,
    compensation: null,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('venue calendar repository mapping', () => {
  it('builds calendar states from the venue slot and event API contracts', () => {
    const calendar = mapVenueCalendar({
      monthKeys: ['2026-09'],
      venue,
      slots: [
        slot('slot-open', 3, 'open'),
        slot('slot-booked', 4, 'booked'),
        slot('slot-blocked', 5, 'blocked'),
        slot('slot-cancelled', 6, 'cancelled'),
      ],
      events: [
        event('pending', 7, 'review'),
        event('published', 8, 'published'),
        event('cancelled', 9, 'cancelled'),
      ],
    });

    const days = calendar.months[0]?.days ?? [];
    expect(calendar.dataStatus).toBe('live');
    expect(days[2]).toMatchObject({
      state: 'available',
      slots: [{ id: 'slot-open', status: 'available' }],
    });
    expect(days[3]?.state).toBe('confirmed');
    expect(days[4]?.state).toBe('blocked');
    expect(days[5]?.state).toBe('unavailable');
    expect(days[6]).toMatchObject({
      state: 'pending',
      events: [{ id: 'pending', status: 'pending' }],
    });
    expect(days[7]).toMatchObject({
      state: 'confirmed',
      events: [{ id: 'published', status: 'confirmed' }],
    });
    expect(days[8]).toMatchObject({ state: 'unavailable', events: [] });
    expect(calendar.blocks).toEqual([
      expect.objectContaining({ id: 'slot-blocked', date: '2026-09-05', reason: 'blocked night' }),
    ]);
  });

  it('creates a stable month window around an anchor month', () => {
    expect(calendarMonthKeys('2026-01', 1, 2)).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
  });

  it('builds same-day and overnight block ranges', () => {
    expect(venueBlockTimeRange({ date: '2026-09-17', from: '19:00', to: '23:00' })).toEqual({
      startTime: '2026-09-17T19:00:00.000Z',
      endTime: '2026-09-17T23:00:00.000Z',
    });
    expect(venueBlockTimeRange({ date: '2026-09-17', from: '23:00', to: '02:00' })).toEqual({
      startTime: '2026-09-17T23:00:00.000Z',
      endTime: '2026-09-18T02:00:00.000Z',
    });
  });
});

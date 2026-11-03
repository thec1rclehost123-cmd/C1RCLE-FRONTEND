import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  freeTimeSlots,
  mapHostAvailability,
  requestHostAvailabilitySlot,
} from './host-availability-repository';

import type { EventDto, VenueAvailabilityDto, VenueDto } from '@c1rcle/contracts';

const post = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/client', () => ({ apiClient: { post } }));

beforeEach(() => {
  post.mockReset();
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-01T00:00:00Z'));
});
afterEach(() => vi.restoreAllMocks());

const timestamp = '2026-09-01T00:00:00.000Z';
const venue: VenueDto = {
  id: 'venue-1',
  organizationId: 'venue-org-1',
  name: 'Skyline Rooftop',
  slug: 'skyline-rooftop',
  status: 'active',
  description: '',
  capacity: 400,
  city: 'Mumbai',
  version: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
};

function availabilitySlot(
  id: string,
  day: number,
  status: VenueAvailabilityDto['slots'][number]['status'],
): VenueAvailabilityDto['slots'][number] {
  const date = `2026-09-${String(day).padStart(2, '0')}`;
  return {
    id,
    label: `${status} slot`,
    startTime: `${date}T20:00:00.000Z`,
    endTime: `${date}T23:00:00.000Z`,
    status,
    capacityFor: null,
  };
}

function event(id: string, day: number, status: EventDto['status']): EventDto {
  const date = `2026-09-${String(day).padStart(2, '0')}`;
  return {
    id,
    organizationId: 'host-org-1',
    venueId: venue.id,
    slug: `event-${id}`,
    title: `Event ${id}`,
    summary: '',
    description: '',
    imageUrl: null,
    startAt: `${date}T14:30:00.000Z`,
    endAt: `${date}T17:30:00.000Z`,
    status,
    visibilityMode: 'public',
    addressDisclosure: 'public',
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

describe('host availability repository mapping', () => {
  it('maps partnered venue slots and host events into the live host calendar', () => {
    const availability: VenueAvailabilityDto = {
      venueId: venue.id,
      from: timestamp,
      to: '2026-09-30T23:59:59.999Z',
      openSlots: 1,
      pendingRequests: 0,
      bookedSlots: 1,
      blockedSlots: 1,
      openMinutes: 180,
      fullyBooked: false,
      slots: [
        availabilitySlot('open-slot', 3, 'open'),
        availabilitySlot('booked-slot', 4, 'booked'),
        availabilitySlot('blocked-slot', 5, 'blocked'),
      ],
    };
    const result = mapHostAvailability({
      monthKeys: ['2026-09'],
      venues: [{ venue, availability }],
      events: [
        event('pending', 6, 'review'),
        event('published', 7, 'published'),
        event('cancelled', 8, 'cancelled'),
      ],
    });

    const firstVenue = result.venues[0];
    const days = firstVenue?.months[0]?.days ?? [];
    expect(result.dataStatus).toBe('live');
    expect(firstVenue?.venue).toMatchObject({
      id: venue.id,
      name: 'Skyline Rooftop',
      meta: 'Mumbai · Capacity 400',
      status: 'Partnered',
    });
    expect(days[2]).toMatchObject({
      state: 'available',
      slots: [
        {
          id: 'free-2026-09-03-0',
          status: 'available',
          startTime: '2026-09-02T18:30:00.000Z',
          endTime: '2026-09-04T18:30:00.000Z',
        },
      ],
    });
    expect(days[3]?.state).toBe('available');
    expect(days[4]?.state).toBe('available');
    expect(days[5]).toMatchObject({ state: 'available', events: [{ id: 'pending' }] });
    expect(days[6]).toMatchObject({
      state: 'available',
      events: [
        {
          id: 'published',
          href: '/partner/host/events/published',
          time: '8:00 PM – 11:00 PM IST',
        },
      ],
    });
    expect(days[7]).toMatchObject({ state: 'available', events: [] });
  });

  it('binds a reschedule slot request to the selected event', async () => {
    await requestHostAvailabilitySlot({
      organizationId: 'host-org-1',
      venueId: 'venue-1',
      slotId: 'slot-new',
      idempotencyKey: 'request-key',
      eventId: 'event-1',
    });

    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/venues/venue-1/slot-requests',
        body: {
          slotId: 'slot-new',
          eventId: 'event-1',
          message: 'Requesting a new Venue slot for event event-1.',
        },
      }),
    );
  });
});

describe('automatic free time windows', () => {
  it('offers the entire empty day in IST', () => {
    expect(freeTimeSlots('2026-09-10', [])).toMatchObject([
      { startTime: '2026-09-09T18:30:00.000Z', endTime: '2026-09-11T18:30:00.000Z' },
    ]);
  });
  it('subtracts overlapping booked, blocked, and pending intervals, including overnight carryover', () => {
    const slots = [
      {
        ...availabilitySlot('overnight', 9, 'booked'),
        startTime: '2026-09-09T17:30:00.000Z',
        endTime: '2026-09-09T20:30:00.000Z',
      },
      {
        ...availabilitySlot('blocked', 10, 'blocked'),
        startTime: '2026-09-10T08:30:00.000Z',
        endTime: '2026-09-10T10:30:00.000Z',
      },
      {
        ...availabilitySlot('pending', 10, 'pending'),
        startTime: '2026-09-10T09:30:00.000Z',
        endTime: '2026-09-10T11:30:00.000Z',
      },
    ];
    expect(freeTimeSlots('2026-09-10', slots)).toMatchObject([
      { startTime: '2026-09-09T20:30:00.000Z', endTime: '2026-09-10T08:30:00.000Z' },
      { startTime: '2026-09-10T11:30:00.000Z', endTime: '2026-09-11T18:30:00.000Z' },
    ]);
  });
  it('does not offer past dates or a fully occupied day', () => {
    expect(freeTimeSlots('2026-08-01', [])).toEqual([]);
    expect(
      freeTimeSlots('2026-09-10', [
        {
          ...availabilitySlot('full', 10, 'blocked'),
          startTime: '2026-09-09T18:30:00.000Z',
          endTime: '2026-09-10T18:30:00.000Z',
        },
      ]),
    ).toEqual([]);
  });
});

describe('overnight free-window boundaries', () => {
  it('keeps late-night availability open through midnight, stopping at a next-day booking', () => {
    const nextDayBooking = {
      ...availabilitySlot('next-day', 11, 'booked'),
      startTime: '2026-09-10T19:30:00.000Z',
      endTime: '2026-09-10T21:30:00.000Z',
    };
    const windows = freeTimeSlots('2026-09-10', [nextDayBooking]);
    expect(windows).toMatchObject([
      { startTime: '2026-09-09T18:30:00.000Z', endTime: '2026-09-10T19:30:00.000Z' },
    ]);
  });
});

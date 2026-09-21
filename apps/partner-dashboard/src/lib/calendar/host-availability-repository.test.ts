import { describe, expect, it } from 'vitest';

import { mapHostAvailability } from './host-availability-repository';

import type { EventDto, VenueAvailabilityDto, VenueDto } from '@c1rcle/contracts';

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
    startAt: `${date}T21:00:00.000Z`,
    endAt: `${date}T23:30:00.000Z`,
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

describe('host availability repository mapping', () => {
  it('maps partnered venue slots and host events into the live host calendar', () => {
    const availability: VenueAvailabilityDto = {
      venueId: venue.id,
      from: timestamp,
      to: '2026-09-30T23:59:59.999Z',
      openSlots: 1,
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
        event('same-day', 3, 'published'),
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
      events: [{ id: 'same-day' }],
      slots: [{ id: 'open-slot', label: '8:00 PM – 11:00 PM', status: 'available' }],
    });
    expect(days[3]?.state).toBe('confirmed');
    expect(days[4]?.state).toBe('unavailable');
    expect(days[5]).toMatchObject({ state: 'pending', events: [{ id: 'pending' }] });
    expect(days[6]).toMatchObject({
      state: 'confirmed',
      events: [{ id: 'published', href: '/partner/host/events/published' }],
    });
    expect(days[7]).toMatchObject({
      state: 'available',
      events: [],
      slots: [
        { id: '2026-09-08-late', status: 'available' },
        { id: '2026-09-08-night', status: 'available' },
      ],
    });
  });

  it('does not block the whole host calendar when the range only has cancelled slots', () => {
    const cancelledAvailability: VenueAvailabilityDto = {
      venueId: venue.id,
      from: timestamp,
      to: '2026-09-30T23:59:59.999Z',
      openSlots: 0,
      bookedSlots: 0,
      blockedSlots: 0,
      openMinutes: 0,
      fullyBooked: false,
      slots: [availabilitySlot('cancelled-slot', 3, 'cancelled')],
    };
    const result = mapHostAvailability({
      monthKeys: ['2026-09'],
      venues: [{ venue, availability: cancelledAvailability }],
      events: [],
    });

    expect(result.venues[0]?.months[0]?.days[0]).toMatchObject({
      state: 'available',
      slots: [
        { id: '2026-09-01-late', status: 'available' },
        { id: '2026-09-01-night', status: 'available' },
      ],
    });
  });
});

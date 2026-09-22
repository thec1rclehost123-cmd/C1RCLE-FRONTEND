import { describe, expect, it } from 'vitest';

import { toBookingEventFixture } from './booking-mapping';

import type { EventDto, VenueDto } from '@c1rcle/contracts';


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

describe('toBookingEventFixture', () => {
  it('maps wire fields into the checkout view model', () => {
    expect(toBookingEventFixture(EVENT, VENUE)).toEqual({
      id: 'sky-night',
      title: 'Sky Night',
      category: 'Music',
      image: 'https://example.com/poster.jpg',
      accentTone: 'purple',
      startsAt: '2026-09-18T19:30:00.000Z',
      venue: 'Skyline Social',
      address: 'Pune',
      city: 'Pune',
      doorNote: 'Entry rules are set by the host and shown at checkout.',
      ticketTiers: [
        {
          id: 'general-admission',
          name: 'General Admission',
          description: 'A rooftop gathering.',
          price: { amountPaise: 120000, currency: 'INR' },
          maximumQuantity: 10,
        },
      ],
    });
  });

  it('falls back honestly without inventing data', () => {
    const mapped = toBookingEventFixture(
      { ...EVENT, tags: [], imageUrl: null, summary: '' },
      null,
    );
    expect(mapped).toMatchObject({
      category: 'Events',
      image: '/c1rcle-logo.webp',
      venue: 'Venue TBA',
      city: 'India',
    });
    expect(mapped.ticketTiers[0]?.description).toBe('Sky Night');
  });

  it('maps free events to a zero price', () => {
    const mapped = toBookingEventFixture({ ...EVENT, isFree: true }, VENUE);
    expect(mapped.ticketTiers[0]?.price).toEqual({ amountPaise: 0, currency: 'INR' });
  });
});

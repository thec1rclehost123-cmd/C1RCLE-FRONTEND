import { describe, expect, it } from 'vitest';

import { toEventDetailFixture } from './event-detail-mapping';

import type { EventDto, HostPublicDto, VenueDto } from '@c1rcle/contracts';


const EVENT: EventDto = {
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
  isPublic: true,
  tags: ['Music'],
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

const HOST: HostPublicDto = { id: 'org_1', name: 'Seed Host', slug: 'seed-host' };

describe('toEventDetailFixture', () => {
  it('maps wire fields into the detail view model', () => {
    const mapped = toEventDetailFixture(EVENT, VENUE, HOST);
    expect(mapped).toMatchObject({
      id: 'evt_1',
      slug: 'sky-night',
      title: 'Sky Night',
      category: 'Music',
      image: 'https://example.com/poster.jpg',
      startsAt: '2026-09-18T19:30:00.000Z',
      endsAt: '2026-09-18T23:30:00.000Z',
      venue: 'Skyline Social',
      city: 'Pune',
      host: 'Seed Host',
      hostId: 'seed-host',
      lifecycle: 'scheduled',
      guests: [],
      interestedCount: 0,
    });
    expect(mapped.ticketTiers).toHaveLength(1);
    expect(mapped.ticketTiers[0]).toMatchObject({
      id: 'general-admission',
      price: { amountPaise: 99900, currency: 'INR' },
    });
  });

  it('maps paused and cancelled statuses to their lifecycles', () => {
    expect(toEventDetailFixture({ ...EVENT, status: 'sales_paused' }, VENUE, HOST).lifecycle).toBe(
      'paused',
    );
    expect(toEventDetailFixture({ ...EVENT, status: 'cancelled' }, VENUE, HOST).lifecycle).toBe(
      'cancelled',
    );
  });

  it('falls back honestly without inventing data', () => {
    const mapped = toEventDetailFixture(
      { ...EVENT, tags: [], imageUrl: null, endAt: null, summary: '', description: '' },
      null,
      null,
    );
    expect(mapped).toMatchObject({
      category: 'Events',
      image: '/c1rcle-logo.webp',
      venue: 'Venue TBA',
      city: 'India',
      host: 'Host TBA',
      endsAt: EVENT.startAt,
    });
    expect(mapped.description).toEqual(['More details will be announced soon.']);
  });

  it('maps free events to a null tier price', () => {
    const mapped = toEventDetailFixture({ ...EVENT, isFree: true }, VENUE, HOST);
    expect(mapped.ticketTiers[0]?.price).toBeNull();
  });
});

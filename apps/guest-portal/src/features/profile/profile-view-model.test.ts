import { describe, expect, it } from 'vitest';

import { deriveInitials, toProfileEvents, toProfileIdentity } from './profile-view-model';

import type { EntitlementDto, EventDto, GuestProfileDto, User, VenueDto } from '@c1rcle/contracts';

const USER = {
  id: 'usr_1',
  email: 'anaya@example.com',
  displayName: 'Anaya Mehta',
  role: 'guest',
  avatarUrl: null,
  mustChangePassword: false,
} satisfies User;

const PROFILE = {
  userId: 'usr_1',
  displayName: 'Anaya Mehta',
  dateOfBirth: '1999-05-10',
  city: 'Pune',
  tastes: ['Techno', 'House', 'Open mic'],
  intents: ['Network'],
  createdAt: '2025-03-14T00:00:00.000Z',
  updatedAt: '2025-03-14T00:00:00.000Z',
} satisfies GuestProfileDto;

function entitlement(overrides: Partial<EntitlementDto> = {}): EntitlementDto {
  return {
    id: 'ent_1',
    orderId: 'ord_1',
    eventId: 'evt_1',
    organizationId: 'org_1',
    tierId: 'tier_1',
    tierName: 'Gallery Pass',
    userId: 'usr_1',
    holderName: 'Anaya Mehta',
    status: 'valid',
    scanCountAllowed: 1,
    scanCount: 0,
    scannedAt: [],
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

function event(overrides: Partial<EventDto> = {}): EventDto {
  return {
    id: 'evt_1',
    organizationId: 'org_1',
    venueId: 'ven_1',
    slug: 'rsvp-night',
    title: 'RSVP Night',
    summary: '',
    description: '',
    imageUrl: null,
    startAt: '2026-12-25T18:00:00.000Z',
    endAt: null,
    status: 'published',
    isPublic: true,
    tags: [],
    startingPricePaise: 0,
    isFree: true,
    cancellationReason: null,
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

const VENUE: VenueDto = {
  id: 'ven_1',
  organizationId: 'org_1',
  name: 'Sky Bar',
  slug: 'sky-bar',
  status: 'active',
  description: '',
  capacity: null,
  city: 'Mumbai',
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('deriveInitials', () => {
  it('takes the first letters of first and last name', () => {
    expect(deriveInitials('Anaya Mehta')).toBe('AM');
    expect(deriveInitials('  Riya   Kapoor  ')).toBe('RK');
  });

  it('handles a single name and an empty name', () => {
    expect(deriveInitials('Riya')).toBe('R');
    expect(deriveInitials('')).toBe('?');
    expect(deriveInitials('   ')).toBe('?');
  });
});

describe('toProfileIdentity', () => {
  it('composes session email with profile city and join date', () => {
    const identity = toProfileIdentity(USER, PROFILE);

    expect(identity).toMatchObject({
      id: 'usr_1',
      displayName: 'Anaya Mehta',
      initials: 'AM',
      email: 'anaya@example.com',
      city: 'Pune',
      memberSince: '2025-03-14T00:00:00.000Z',
      badges: ['Member'],
    });
    // No endpoint exposes these yet, so they must stay absent rather than
    // being filled with a placeholder the UI would render as real data.
    expect(identity.phoneNumber).toBeUndefined();
    expect(identity.instagram).toBeUndefined();
    expect(identity.gender).toBeUndefined();
    expect(identity.signInMethod).toBeUndefined();
  });

  it('falls back to the session identity when no profile is saved (404)', () => {
    const identity = toProfileIdentity(USER, null);

    expect(identity.displayName).toBe('Anaya Mehta');
    expect(identity.email).toBe('anaya@example.com');
    expect(identity.city).toBe('');
    expect(identity.memberSince).toBeUndefined();
  });

  it('renders a neutral guest when there is neither session nor profile', () => {
    const identity = toProfileIdentity(null, null);

    expect(identity.displayName).toBe('Guest');
    expect(identity.initials).toBe('G');
    expect(identity.email).toBe('');
  });
});

describe('toProfileEvents', () => {
  const resolve = (data: { event: EventDto; venue: VenueDto | null }) => (_eventId: string) =>
    Promise.resolve(data);

  it('routes a future entitlement to upcoming, using the tier as the label', async () => {
    const result = await toProfileEvents(
      [entitlement()],
      resolve({ event: event(), venue: VENUE }),
      new Date('2026-10-01T00:00:00.000Z'),
    );

    expect(result.upcomingEvents).toHaveLength(1);
    expect(result.attendedEvents).toHaveLength(0);
    expect(result.upcomingEvents[0]).toMatchObject({
      slug: 'rsvp-night',
      title: 'RSVP Night',
      venue: 'Sky Bar',
      city: 'Mumbai',
      participationLabel: 'Gallery Pass',
      image: '/c1rcle-logo.webp',
    });
  });

  it('routes a redeemed entitlement to attended', async () => {
    const result = await toProfileEvents(
      [entitlement({ status: 'redeemed' })],
      resolve({ event: event(), venue: VENUE }),
      new Date('2026-10-01T00:00:00.000Z'),
    );

    expect(result.upcomingEvents).toHaveLength(0);
    expect(result.attendedEvents).toHaveLength(1);
  });

  it('routes an ended event to attended even if still valid', async () => {
    const result = await toProfileEvents(
      [entitlement()],
      resolve({ event: event({ endAt: '2026-01-02T00:00:00.000Z' }), venue: VENUE }),
      new Date('2026-10-01T00:00:00.000Z'),
    );

    expect(result.upcomingEvents).toHaveLength(0);
    expect(result.attendedEvents).toHaveLength(1);
  });

  it('skips entitlements whose event no longer resolves, never inventing one', async () => {
    const result = await toProfileEvents(
      [entitlement()],
      (_eventId: string) => Promise.resolve(null),
      new Date('2026-10-01T00:00:00.000Z'),
    );

    expect(result.upcomingEvents).toHaveLength(0);
    expect(result.attendedEvents).toHaveLength(0);
  });

  it('groups by order + tier so a bundle renders once, not per ticket', async () => {
    const result = await toProfileEvents(
      [entitlement({ id: 'ent_a' }), entitlement({ id: 'ent_b' })],
      resolve({ event: event(), venue: VENUE }),
      new Date('2026-10-01T00:00:00.000Z'),
    );

    expect(result.upcomingEvents).toHaveLength(1);
    expect(result.upcomingEvents[0]?.id).toBe('ord_1::tier_1');
  });
});

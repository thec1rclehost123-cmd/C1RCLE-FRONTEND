import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  listPartnerships,
  requestPartnership,
  resolvePartnership,
  setVenueShare,
} from './api-partnerships-repository';

import type { PartnershipDto } from '@c1rcle/contracts';

const getMock = vi.hoisted(() => vi.fn());
const postMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: getMock, post: postMock },
}));

const partnership: PartnershipDto = {
  id: 'part_1',
  hostOrganizationId: 'org_host',
  venueOrganizationId: 'org_venue',
  venueId: 'venue_1',
  initiatedBy: 'host',
  status: 'active',
  message: null,
  venueShareRate: 20,
  resolutionReason: null,
  resolvedAt: null,
  version: 2,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-02T10:00:00.000Z',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

afterEach(() => {
  getMock.mockReset();
  postMock.mockReset();
});

describe('listPartnerships', () => {
  it('scopes the read to the organization on both the path and the header', async () => {
    getMock.mockResolvedValue({ items: [partnership] });

    const rows = await listPartnerships('org_venue');

    expect(rows).toEqual([partnership]);
    expect(getMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/organizations/org_venue/partnerships',
        headers: { 'X-Organization-Id': 'org_venue' },
      }),
    );
  });

  it('encodes the organization id rather than interpolating it raw', async () => {
    getMock.mockResolvedValue({ items: [] });

    await listPartnerships('org/with slash');

    expect(getMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/organizations/org%2Fwith%20slash/partnerships');
  });
});

describe('requestPartnership', () => {
  it('sends an Idempotency-Key alongside the org scope', async () => {
    postMock.mockResolvedValue(partnership);

    await requestPartnership('org_venue', { venueId: 'venue_1', initiatedBy: 'venue' });

    const init = postMock.mock.calls[0]?.[0];
    expect(init?.path).toBe('/api/v2/partnerships');
    expect(init?.headers['X-Organization-Id']).toBe('org_venue');
    expect(init?.headers['Idempotency-Key']).toMatch(UUID);
  });

  it('replays the caller-supplied key so a retried intent is not duplicated', async () => {
    postMock.mockResolvedValue(partnership);

    await requestPartnership(
      'org_venue',
      { venueId: 'venue_1', initiatedBy: 'venue' },
      'intent-abc',
    );

    expect(postMock.mock.calls[0]?.[0]?.headers['Idempotency-Key']).toBe('intent-abc');
  });

  it('proposes a whole-number percent, not a 0..1 ratio', async () => {
    postMock.mockResolvedValue(partnership);

    await requestPartnership('org_venue', {
      venueId: 'venue_1',
      initiatedBy: 'venue',
      venueShareRate: 20,
    });

    expect(postMock.mock.calls[0]?.[0]?.body).toEqual({
      venueId: 'venue_1',
      initiatedBy: 'venue',
      venueShareRate: 20,
    });
  });
});

describe('resolvePartnership', () => {
  it.each(['approve', 'reject', 'block', 'end'] as const)(
    'posts /%s with the org scope and an idempotency key',
    async (action) => {
      postMock.mockResolvedValue(partnership);

      await resolvePartnership('org_venue', 'part_1', action);

      const init = postMock.mock.calls[0]?.[0];
      expect(init?.path).toBe('/api/v2/partnerships/part_1/' + action);
      expect(init?.headers['X-Organization-Id']).toBe('org_venue');
      expect(init?.headers['Idempotency-Key']).toMatch(UUID);
    },
  );

  it('includes a reason only when one was given, keeping the body strict-shaped', async () => {
    postMock.mockResolvedValue(partnership);

    await resolvePartnership('org_venue', 'part_1', 'reject');
    expect(postMock.mock.calls[0]?.[0]?.body).toEqual({});

    await resolvePartnership('org_venue', 'part_1', 'reject', { reason: 'Outside our window' });
    expect(postMock.mock.calls[1]?.[0]?.body).toEqual({ reason: 'Outside our window' });
  });

  it('encodes the partnership id', async () => {
    postMock.mockResolvedValue(partnership);

    await resolvePartnership('org_venue', 'part/1', 'approve');

    expect(postMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/partnerships/part%2F1/approve');
  });
});

describe('setVenueShare', () => {
  it('negotiates a rate on the venue-share command, scoped and idempotent', async () => {
    postMock.mockResolvedValue({ ...partnership, venueShareRate: 25, version: 3 });

    const updated = await setVenueShare('org_venue', 'part_1', 25);

    const init = postMock.mock.calls[0]?.[0];
    expect(init?.path).toBe('/api/v2/partnerships/part_1/venue-share');
    expect(init?.body).toEqual({ venueShareRate: 25 });
    expect(init?.headers['X-Organization-Id']).toBe('org_venue');
    expect(init?.headers['Idempotency-Key']).toMatch(UUID);
    expect(updated.venueShareRate).toBe(25);
  });

  it('sends an explicit null to clear the rate rather than omitting the key', async () => {
    postMock.mockResolvedValue({ ...partnership, venueShareRate: null });

    await setVenueShare('org_venue', 'part_1', null);

    // Omitting `venueShareRate` would fail the `.strict()` body schema; the
    // clear must be an explicit null.
    expect(postMock.mock.calls[0]?.[0]?.body).toEqual({ venueShareRate: null });
  });

  it('replays a caller-supplied key so a double-click cannot renegotiate twice', async () => {
    postMock.mockResolvedValue(partnership);

    await setVenueShare('org_venue', 'part_1', 30, 'intent-share-1');

    expect(postMock.mock.calls[0]?.[0]?.headers['Idempotency-Key']).toBe('intent-share-1');
  });
});

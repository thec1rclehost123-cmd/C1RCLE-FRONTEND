import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseEventStatus } from '@/components/partner-v3/events/PartnerEventsScreen';

const mocks = vi.hoisted(() => ({
  cookieHeader: vi.fn(() => 'session=local-test'),
  get: vi.fn(),
  redirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: () => ({ toString: mocks.cookieHeader }) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/api/server-client', () => ({
  createServerApiClient: () => ({ get: mocks.get }),
}));

describe('loadPartnerEvents', () => {
  beforeEach(() => {
    mocks.cookieHeader.mockReset();
    mocks.cookieHeader.mockReturnValue('session=local-test');
    mocks.get.mockReset();
    mocks.redirect.mockClear();
  });

  it('routes an authenticated user with no active organization through workspace selection', async () => {
    const { loadPartnerEvents } = await import('./load-partner-events');

    await expect(loadPartnerEvents({ studio: 'host' })).rejects.toThrow(
      'redirect:/partner/select-organization',
    );

    expect(mocks.redirect).toHaveBeenCalledWith('/partner/select-organization');
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('uses the Venue event read model and preserves Host ownership for the Hosts filter', async () => {
    mocks.cookieHeader.mockReturnValue('c1rcle.active-org=venue-org');
    mocks.get.mockResolvedValue({
      items: [
        {
          id: 'host-event',
          ownerType: 'host',
          title: 'Host event',
          imageUrl: null,
          hostName: 'Test Host',
          venueId: 'venue-id',
          venueName: 'Test Venue',
          status: 'published',
          startAt: '2026-11-20T20:00:00.000Z',
          endAt: '2026-11-21T02:00:00.000Z',
          eventCapacity: 100,
          venueCapacity: 300,
          ticketUnitsIssued: 20,
          rsvpUnitsIssued: 5,
          expectedGuests: 25,
          checkedInGuests: 0,
          operationalCountsComplete: true,
          baseStartingPricePaise: 50000,
          currentStartingPricePaise: 35000,
          isFree: false,
        },
      ],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false, nextCursor: null },
      complete: true,
    });
    const { loadPartnerEvents } = await import('./load-partner-events');

    const result = await loadPartnerEvents({ studio: 'venue' });

    expect(mocks.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/organizations/venue-org/venue-events?limit=100',
      }),
    );
    expect(result.events[0]?.party).toBe('hosts');
    expect(result.events[0]).toMatchObject({
      priceLabel: '₹350.00',
      basePriceLabel: '₹500.00',
      capacity: 300,
      operational: { eventCapacity: 100, venueCapacity: 300 },
    });
    expect(result.complete).toBe(true);
  });

  it('keeps current and base prices distinct on Host event cards', async () => {
    mocks.cookieHeader.mockReturnValue('c1rcle.active-org=host-org');
    mocks.get.mockResolvedValue({
      items: [
        {
          id: 'host-price-event',
          organizationId: 'host-org',
          venueId: 'venue-1',
          slug: 'host-price-event',
          title: 'Host price event',
          summary: '',
          description: '',
          imageUrl: null,
          startAt: '2026-12-01T20:00:00.000Z',
          endAt: null,
          status: 'published',
          visibilityMode: 'public',
          addressDisclosure: 'public',
          isPublic: true,
          tags: [],
          startingPricePaise: 99_900,
          currentStartingPricePaise: 65_000,
          isFree: false,
          cancellationReason: null,
          version: 1,
          createdAt: '2026-11-01T00:00:00.000Z',
          updatedAt: '2026-11-01T00:00:00.000Z',
          capacity: 100,
          venueName: 'Test Venue',
          ticketsSold: 10,
          salesCountComplete: true,
        },
      ],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false, nextCursor: null },
    });
    const { loadPartnerEvents } = await import('./load-partner-events');

    const result = await loadPartnerEvents({ studio: 'host' });

    expect(result.events[0]).toMatchObject({
      priceLabel: '₹650.00',
      basePriceLabel: '₹999.00',
    });
  });

  it('keeps incomplete drafts distinct and completes published events at their effective end', async () => {
    const { mapStatus } = await import('./load-partner-events');
    const now = new Date('2026-11-09T12:00:00.000Z');
    expect(mapStatus('draft', new Date('2026-11-08T12:00:00Z'), null, now)).toBe('Draft');
    expect(
      mapStatus(
        'published',
        new Date('2026-11-09T11:00:00Z'),
        new Date('2026-11-10T12:00:00Z'),
        now,
      ),
    ).toBe('Live');
    expect(
      mapStatus(
        'published',
        new Date('2026-11-08T12:00:00Z'),
        new Date('2026-11-09T11:00:00Z'),
        now,
      ),
    ).toBe('Completed');
    expect(mapStatus('published', new Date('2026-11-09T11:00:00Z'), null, now)).toBe('Completed');
    expect(mapStatus('postponed', new Date('2026-11-08T12:00:00Z'), null, now)).toBe('Postponed');
    expect(mapStatus('cancelled', new Date('2026-11-08T12:00:00Z'), null, now)).toBe('Cancelled');
    expect(mapStatus('archived', new Date('2026-11-08T12:00:00Z'), null, now)).toBe('Archived');
  });

  it('parses the Completed status filter', () => {
    expect(parseEventStatus('completed')).toBe('Completed');
    expect(parseEventStatus('draft')).toBe('Draft');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from './auth-proxy';
import { loadSlotRequestsData } from './slot-request-gateway';

vi.mock('./auth-proxy', () => ({
  forwardToGateway: vi.fn(),
  mintIdempotencyKey: vi.fn(() => 'test-idempotency-key'),
  parseJson: (value: string) => JSON.parse(value) as unknown,
}));

const organizationId = 'host-org-m3';
const venueId = 'venue-m3';

describe('loadSlotRequestsData outgoing venue enrichment', () => {
  beforeEach(() => {
    vi.mocked(forwardToGateway).mockImplementation((route) => {
      if (route.includes(`/organizations/${organizationId}/slot-requests`)) {
        return Promise.resolve(
          Response.json({
            items: [
              {
                id: 'request-m3',
                venueId,
                slotId: 'slot-m3',
                slotStartTime: '2026-11-06T13:30:00.000Z',
                slotEndTime: '2026-11-06T17:30:00.000Z',
                timezone: 'Asia/Kolkata',
                eventId: 'event-m3',
                hostId: organizationId,
                status: 'accepted',
                message: 'Namespaced request',
                version: 2,
                createdAt: '2026-10-23T10:00:00.000Z',
                updatedAt: '2026-10-23T10:01:00.000Z',
              },
            ],
            pageInfo: { nextCursor: null, total: 1 },
          }),
        );
      }
      if (route.includes(`/organizations/${organizationId}/partnerships`)) {
        return Promise.resolve(
          Response.json({
            items: [
              {
                id: 'partnership-m3',
                hostOrganizationId: organizationId,
                venueOrganizationId: 'venue-org-m3',
                venueId,
                initiatedBy: 'venue',
                status: 'active',
                message: null,
                venueShareRate: null,
                resolutionReason: null,
                resolvedAt: null,
                version: 1,
                createdAt: '2026-10-01T00:00:00.000Z',
                updatedAt: '2026-10-01T00:00:00.000Z',
                venueName: 'Keshvi Agarwal',
              },
            ],
            pageInfo: { nextCursor: null, total: 1 },
          }),
        );
      }
      if (route.includes(`/organizations/${organizationId}/events`)) {
        return Promise.resolve(
          Response.json({
            items: [
              {
                id: 'event-m3',
                organizationId,
                venueId,
                slug: 'm3-host-e2e',
                title: 'M3-HOST-E2E',
                summary: 'Namespaced Host event',
                description: 'Namespaced Host event',
                imageUrl: null,
                startAt: '2026-11-06T13:30:00.000Z',
                endAt: '2026-11-06T17:30:00.000Z',
                status: 'published',
                isPublic: true,
                tags: [],
                startingPricePaise: 10_000,
                isFree: false,
                cancellationReason: null,
                compensation: null,
                version: 1,
                createdAt: '2026-10-23T10:00:00.000Z',
                updatedAt: '2026-10-23T10:01:00.000Z',
              },
            ],
            pageInfo: { nextCursor: null, total: 1 },
          }),
        );
      }
      throw new Error(`Unexpected test route: ${route}`);
    });
  });

  it('uses the active partnership display name instead of exposing the venue ID', async () => {
    const result = await loadSlotRequestsData('outgoing', organizationId, {
      cookie: null,
      headers: {},
    });

    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]?.eventId).toBe('event-m3');
    expect(result.requests[0]?.partnerName).toBe('Keshvi Agarwal');
    expect(result.requests[0]?.event.venue).toBe('Keshvi Agarwal');
    expect(result.requests[0]?.event.date).toBe('Fri, 6 Nov');
    expect(result.requests[0]?.event.time).toBe('7:00 pm – 11:00 pm');
  });
});

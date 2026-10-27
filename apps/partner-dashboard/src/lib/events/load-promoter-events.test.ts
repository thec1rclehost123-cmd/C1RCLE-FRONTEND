import { describe, expect, it, vi } from 'vitest';

import { loadPromoterEvents } from './load-promoter-events';

import type { ServerApiClient } from '@/lib/api/server-client';

const cookieString = vi.hoisted(() =>
  vi.fn(() => 'c1rcle.active-org=org_1; session=session-value'),
);

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: () => ({ toString: cookieString }) }));
type WireGet = (options: {
  readonly path: string;
  readonly headers?: Readonly<Record<string, string>>;
}) => Promise<unknown>;

describe('loadPromoterEvents', () => {
  it('maps real assignments and public listings without inventing referral metrics', async () => {
    const apiCalls: Parameters<WireGet>[0][] = [];
    const client = {
      get: (options: Parameters<WireGet>[0]) => {
        apiCalls.push(options);
        const { path } = options;
        if (path.includes('/promoters/org_1/events')) {
          return Promise.resolve([
            {
              event: {
                id: 'evt_assigned',
                organizationId: 'org_2',
                venueId: 'venue_1',
                slug: 'assigned',
                title: 'Assigned event',
                summary: '',
                description: '',
                imageUrl: null,
                startAt: '2026-11-20T18:00:00.000Z',
                endAt: null,
                status: 'published',
                isPublic: true,
                tags: [],
                startingPricePaise: null,
                isFree: false,
                cancellationReason: null,
                version: 1,
                createdAt: '2026-09-01T00:00:00.000Z',
                updatedAt: '2026-09-01T00:00:00.000Z',
              },
              assignment: {
                id: 'assignment_1',
                eventId: 'evt_assigned',
                promoterId: 'org_1',
                status: 'active',
                terms: { version: 1, ratePercent: 15, flatPaise: 0 },
                endedAt: null,
                version: 1,
                createdAt: '2026-09-01T00:00:00.000Z',
                updatedAt: '2026-09-01T00:00:00.000Z',
              },
            },
          ]);
        }
        if (path === '/api/v2/public/events?limit=100') {
          return Promise.resolve({
            items: [
              {
                id: 'evt_public',
                organizationId: 'org_2',
                venueId: null,
                slug: 'public',
                title: 'Public listing',
                summary: '',
                description: '',
                imageUrl: null,
                startAt: '2026-11-21T18:00:00.000Z',
                endAt: null,
                status: 'published',
                isPublic: true,
                tags: [],
                startingPricePaise: null,
                isFree: false,
                cancellationReason: null,
                version: 1,
                createdAt: '2026-09-01T00:00:00.000Z',
                updatedAt: '2026-09-01T00:00:00.000Z',
              },
            ],
            pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
          });
        }
        return Promise.reject(new Error(`Unexpected API path: ${path}`));
      },
    } as unknown as ServerApiClient;

    const result = await loadPromoterEvents({ client, organizationId: 'org_1' });

    expect(result.dataStatus).toBe('api');
    expect(result.linkedEvents[0]).toMatchObject({
      id: 'evt_assigned',
      name: 'Assigned event',
      clicks: null,
      sales: null,
      commissionLabel: '15% commission',
    });
    expect(result.discoverEvents[0]).toMatchObject({
      id: 'evt_public',
      name: 'Public listing',
      accessState: 'public',
    });
    expect(result.discoverTotal).toBe(1);
    expect(apiCalls.map((call) => call.path)).toEqual([
      '/api/v2/promoters/org_1/events',
      '/api/v2/public/events?limit=100',
    ]);
    expect(apiCalls[0]?.headers).toEqual({ 'x-organization-id': 'org_1' });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  listPromoterConnections,
  resolvePromoterConnection,
} from './promoter-connection-repository';

import type { PromoterConnectionDto } from '@c1rcle/contracts';

interface CapturedRequest {
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly body?: unknown;
  readonly query?: unknown;
}

const getMock = vi.hoisted(() => vi.fn<(options: CapturedRequest) => Promise<unknown>>());
const postMock = vi.hoisted(() => vi.fn<(options: CapturedRequest) => Promise<unknown>>());

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: getMock, post: postMock },
}));

const connection: PromoterConnectionDto = {
  id: 'conn_1',
  promoterId: 'org_promoter',
  targetId: 'org_venue',
  targetType: 'venue',
  initiatedBy: 'promoter',
  status: 'pending',
  message: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  promoterName: null,
  promoterSlug: null,
  targetName: null,
  targetSlug: null,
  targetCity: null,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

afterEach(() => {
  getMock.mockReset();
  postMock.mockReset();
});

describe('listPromoterConnections', () => {
  it('scopes the read to the organization on both the path and the header', async () => {
    getMock.mockResolvedValue({ items: [connection] });

    const rows = await listPromoterConnections({ organizationId: 'org_venue' });

    expect(rows).toEqual([connection]);
    expect(getMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/organizations/org_venue/promoter-connections',
        headers: { 'X-Organization-Id': 'org_venue' },
      }),
    );
  });
});

describe('resolvePromoterConnection', () => {
  it.each(['approve', 'reject', 'block', 'revoke'] as const)(
    'posts /%s with the org scope and an idempotency key',
    async (action) => {
      postMock.mockResolvedValue(connection);

      await resolvePromoterConnection('org_venue', 'conn_1', action);

      const init = postMock.mock.calls[0]?.[0];
      expect(init?.path).toBe('/api/v2/promoter-connections/conn_1/' + action);
      expect(init?.headers['X-Organization-Id']).toBe('org_venue');
      expect(init?.headers['Idempotency-Key']).toMatch(UUID);
    },
  );

  it('encodes the connection id', async () => {
    postMock.mockResolvedValue(connection);

    await resolvePromoterConnection('org_venue', 'conn/1', 'approve');

    expect(postMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/promoter-connections/conn%2F1/approve');
  });
});

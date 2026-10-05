import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import {
  classifyStudioPartnersFailure,
  loadHostPartnersData,
  loadPromoterPartnersData,
  loadVenuePartnersData,
  StudioPartnersLoadError,
} from './load-studio-partners';

import type { ServerApiClient } from '@/lib/api/server-client';

const cookieMock = vi.hoisted(() => vi.fn(() => 'c1rcle.active-org=org_venue; session=abc'));

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: () => ({ toString: () => cookieMock() }),
}));

type WireGet = (options: {
  readonly path: string;
  readonly headers?: Readonly<Record<string, string>>;
}) => Promise<unknown>;

const getMock = vi.fn<WireGet>();

const client = { get: getMock } as unknown as ServerApiClient;

const PARTNERSHIP = {
  id: 'part_1',
  hostOrganizationId: 'org_host',
  venueOrganizationId: 'org_venue',
  venueId: 'venue_1',
  initiatedBy: 'host',
  status: 'active',
  message: null,
  venueShareRate: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  hostName: 'Real Host',
  venueName: 'Real Venue',
};

const CONNECTION = {
  id: 'conn_1',
  promoterId: 'org_promoter',
  targetId: 'org_venue',
  targetType: 'venue',
  initiatedBy: 'promoter',
  status: 'active',
  message: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-09-21T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
  promoterName: 'Real Promoter',
  promoterSlug: null,
  targetName: null,
  targetSlug: null,
  targetCity: 'Mumbai',
};

const DISCOVERED = {
  id: 'org_host_9',
  kind: 'host',
  name: 'Discovered Host',
  slug: 'discovered-host',
  city: 'Pune',
  verified: true,
  organizationId: 'org_host_9',
  venueId: null,
};

function apiError(code: 'unauthorized' | 'forbidden' | 'server', status: number): ApiClientError {
  return new ApiClientError({
    code,
    message: 'boom',
    status,
    requestId: undefined,
    fieldErrors: undefined,
  });
}

beforeEach(() => {
  getMock.mockReset();
  cookieMock.mockReturnValue('c1rcle.active-org=org_venue; session=abc');
  getMock.mockImplementation(({ path }) => {
    if (path.includes('/partnerships')) {
      return Promise.resolve({ items: [PARTNERSHIP], pageInfo: { hasNextPage: false } });
    }
    if (path.includes('/promoter-connections')) {
      return Promise.resolve({ items: [CONNECTION], pageInfo: { hasNextPage: false } });
    }
    if (path.includes('/discover-partners')) {
      return Promise.resolve({ items: [DISCOVERED], pageInfo: { hasNextPage: false } });
    }
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
});

describe('loadVenuePartnersData', () => {
  it('serves backend rows with dataStatus api, never fixtures', async () => {
    const data = await loadVenuePartnersData({ client, organizationId: 'org_venue' });

    expect(data.dataStatus).toBe('api');
    expect(data.hosts.connected.map((item) => item.name)).toEqual(['Real Host']);
    expect(data.promoters.connected.map((item) => item.name)).toEqual(['Real Promoter']);
    expect(data.hosts.discover.map((item) => item.name)).toEqual(['Discovered Host']);
    expect(data.staff).toEqual([]);
    expect(getMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining('/partnerships') as string }),
    );
  });

  it('throws no-organization when no org is selected', async () => {
    await expect(loadVenuePartnersData({ client, organizationId: null })).rejects.toMatchObject({
      reason: 'no-organization',
    });
  });
});

describe('loadHostPartnersData', () => {
  it('names the venue counterparty from the host side', async () => {
    const data = await loadHostPartnersData({ client, organizationId: 'org_host' });

    expect(data.dataStatus).toBe('api');
    expect(data.venues.connected.map((item) => item.name)).toEqual(['Real Venue']);
  });
});

describe('loadPromoterPartnersData', () => {
  it('splits the promoter graph for the calling promoter', async () => {
    getMock.mockImplementation(({ path }) => {
      if (path.includes('/promoter-connections')) {
        return Promise.resolve({
          items: [{ ...CONNECTION, status: 'active', targetName: 'Real Venue' }],
          pageInfo: { hasNextPage: false },
        });
      }
      return Promise.resolve({ items: [], pageInfo: { hasNextPage: false } });
    });
    const data = await loadPromoterPartnersData({ client, organizationId: 'org_promoter' });

    expect(data.dataStatus).toBe('api');
    expect(data.active.map((item) => item.name)).toEqual(['Real Venue']);
  });
});

describe('classifyStudioPartnersFailure', () => {
  it.each([
    ['unauthorized', 401, 'signed-out'],
    ['forbidden', 403, 'forbidden'],
    ['server', 500, 'api'],
  ] as const)('maps %s to %s', (code, status, reason) => {
    expect(classifyStudioPartnersFailure(apiError(code, status))).toBe(reason);
  });

  it('maps unknown failures to api', () => {
    expect(classifyStudioPartnersFailure(new Error('boom'))).toBe('api');
  });

  it('wraps a signed-out read as signed-out, not a retryable api error', async () => {
    getMock.mockRejectedValue(apiError('unauthorized', 401));
    await expect(
      loadVenuePartnersData({ client, organizationId: 'org_venue' }),
    ).rejects.toMatchObject({ reason: 'signed-out' });
    expect.assertions(1);
  });
});

describe('StudioPartnersLoadError', () => {
  it('carries its reason', () => {
    expect(new StudioPartnersLoadError('forbidden', 'nope').reason).toBe('forbidden');
  });
});

import { describe, expect, it, vi } from 'vitest';

import {
  getDiscoverablePartners,
  getPartnerships,
  getPromoterConnections,
} from './partner-graph-repository';

import type { PartnerGraphApiClient } from './partner-graph-repository';

type WireGet = (options: {
  readonly path: string;
  readonly headers?: Readonly<Record<string, string>>;
}) => Promise<unknown>;

const getMock = vi.fn<WireGet>(() =>
  Promise.resolve({ items: [], pageInfo: { hasNextPage: false } }),
);

// One cast, because the client's get is generic in the schema and a
// non-generic mock cannot satisfy it structurally.
const client = { get: getMock } as unknown as PartnerGraphApiClient;

describe('partner-graph-repository', () => {
  it('scopes the partnerships read to the organization', async () => {
    await getPartnerships(client, 'org_venue');

    expect(getMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/organizations/org_venue/partnerships',
        headers: { 'x-organization-id': 'org_venue' },
      }),
    );
  });

  it('scopes the promoter-connections read to the organization', async () => {
    await getPromoterConnections(client, 'org_venue');

    expect(getMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining('/promoter-connections') as string,
        headers: { 'x-organization-id': 'org_venue' },
      }),
    );
  });

  it('forwards the discover kind filter server-side', async () => {
    await getDiscoverablePartners(client, 'org_venue', { type: 'host' });

    expect(getMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining('type=host') as string,
        headers: { 'x-organization-id': 'org_venue' },
      }),
    );
  });
});

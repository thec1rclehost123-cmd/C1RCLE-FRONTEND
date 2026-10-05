import { describe, expect, it } from 'vitest';

import {
  toHostPartnersData,
  toPromoterPartnersData,
  toVenuePartnersData,
} from './studio-partners-view-model';

import type { DiscoverPartnerDto, PartnershipDto, PromoterConnectionDto } from '@c1rcle/contracts';

const partnership: PartnershipDto = {
  id: 'part_1',
  hostOrganizationId: 'org_host',
  venueOrganizationId: 'org_venue',
  venueId: 'venue_1',
  initiatedBy: 'host',
  status: 'pending',
  message: 'Hello',
  venueShareRate: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  hostName: 'Real Host',
  venueName: 'Real Venue',
};

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
  createdAt: '2026-09-21T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
  promoterName: 'Real Promoter',
  promoterSlug: null,
  targetName: null,
  targetSlug: null,
  targetCity: 'Mumbai',
};

const discoveredHost: DiscoverPartnerDto = {
  id: 'org_host_9',
  kind: 'host',
  name: 'Discovered Host',
  slug: 'discovered-host',
  city: 'Pune',
  verified: true,
  organizationId: 'org_host_9',
  venueId: null,
};

describe('toVenuePartnersData', () => {
  it('maps active partnerships to connected hosts and pending to requests', () => {
    const data = toVenuePartnersData({
      partnerships: [
        { ...partnership, id: 'part_active', status: 'active' },
        partnership,
        { ...partnership, id: 'part_sent', initiatedBy: 'venue' },
      ],
      promoterConnections: [],
      discoveredHosts: [discoveredHost],
      discoveredPromoters: [],
    });

    expect(data.dataStatus).toBe('api');
    expect(data.hosts.connected.map((item) => item.name)).toEqual(['Real Host']);
    expect(data.hosts.connected[0]?.status).toBe('Partnered');
    expect(data.hosts.requests.incoming.map((item) => item.id)).toEqual(['part_1']);
    expect(data.hosts.requests.outgoing.map((item) => item.id)).toEqual(['part_sent']);
    expect(data.hosts.discover.map((item) => item.name)).toEqual(['Discovered Host']);
    expect(data.hosts.discover[0]?.verified).toBe(true);
    expect(data.staff).toEqual([]);
  });

  it('carries mutation targets on request rows and never invents locations', () => {
    const data = toVenuePartnersData({
      partnerships: [{ ...partnership, status: 'active', hostName: null }],
      promoterConnections: [],
      discoveredHosts: [],
      discoveredPromoters: [],
    });

    expect(data.hosts.connected[0]?.name).toBe('org_host');
    expect(data.hosts.requests).toEqual({ incoming: [], outgoing: [] });
  });
});

describe('toHostPartnersData', () => {
  it('names the venue counterparty from the venue side', () => {
    const data = toHostPartnersData({
      partnerships: [
        { ...partnership, status: 'active' },
        { ...partnership, id: 'part_out', initiatedBy: 'host' },
      ],
      promoterConnections: [],
      discoveredVenues: [],
      discoveredPromoters: [],
    });

    expect(data.venues.connected.map((item) => item.name)).toEqual(['Real Venue']);
    expect(data.venues.requests.outgoing.map((item) => item.id)).toEqual(['part_out']);
    expect(data.staff).toEqual([]);
  });
});

describe('toPromoterPartnersData', () => {
  it('splits the promoter graph into active/discover/incoming/pending/declined', () => {
    const data = toPromoterPartnersData({
      organizationId: 'org_promoter',
      promoterConnections: [
        { ...connection, id: 'conn_active', status: 'active' },
        connection,
        { ...connection, id: 'conn_sent', initiatedBy: 'target' },
        { ...connection, id: 'conn_no', status: 'rejected' },
        // Another promoter's connection must not leak into this studio.
        { ...connection, id: 'conn_other', promoterId: 'org_other' },
      ],
      discovered: [
        {
          id: 'venue_9',
          kind: 'venue',
          name: 'Discovered Venue',
          slug: 'discovered-venue',
          city: null,
          verified: false,
          organizationId: 'org_venue_9',
          venueId: 'venue_9',
        },
      ],
    });

    expect(data.dataStatus).toBe('api');
    expect(data.active.map((item) => item.id)).toEqual(['conn_active']);
    expect(data.incoming.map((item) => item.id)).toEqual(['conn_sent']);
    expect(data.pending.map((item) => item.id)).toEqual(['conn_1']);
    expect(data.declined.map((item) => item.id)).toEqual(['conn_no']);
    expect(data.activePartnersCount).toBe(1);
    expect(data.pendingPartnersCount).toBe(1);
    expect(data.discover.map((item) => item.name)).toEqual(['Discovered Venue']);
    expect(data.discover[0]?.actionLabel).toBe('Send Request');
  });
});

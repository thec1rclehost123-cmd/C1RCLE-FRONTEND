import { getActiveOrgId } from '@/lib/org/active-org';

import { partnershipApi, promoterConnectionApi } from '../api/partner-connections';

import {
  type HostRepository,
  type PromoterRepository,
  type PartnershipDto,
  type PromoterConnectionDto,
  type PartnerRelationship,
  type PromoterPartner,
} from './contracts';
import { fixturePromoterRepository } from './fixture-promoter-repository';
import { loadPromoterLinkedEvents } from './promoter-events-api';


export function createApiPartnerRepositoriesV2(): {
  readonly host: HostRepository;
  readonly promoter: PromoterRepository;
} {
  const getOrgId = (): string => {
    const orgId = getActiveOrgId();
    if (!orgId) throw new Error('No organization ID in session');
    return orgId;
  };

  const mapPartnershipToRelationship = (p: PartnershipDto): PartnerRelationship => ({
    id: p.id,
    kind: p.initiatedBy === 'host' ? 'venue' : 'host',
    name:
      p.initiatedBy === 'host'
        ? (p.venueName ?? `Venue ${p.venueId.slice(0, 8)}`)
        : (p.hostName ?? `Host ${p.hostOrganizationId.slice(0, 8)}`),
    city: p.venueCity ?? 'Unknown',
    verified: Boolean(p.venueName ?? p.hostName),
    status: p.status === 'active' ? 'partnered' : p.status === 'pending' ? 'pending' : 'discover',
    eventsTogether: 0,
    responseTime: 'Unknown',
    categories: [],
  });

  const mapPromoterConnectionToPartner = (c: PromoterConnectionDto): PromoterPartner => ({
    id: c.id,
    kind: c.targetType,
    name: c.targetName ?? c.promoterName ?? `${c.targetType} ${c.targetId.slice(0, 8)}`,
    city: c.targetCity ?? 'Unknown',
    category: 'Unknown',
    verified: Boolean(c.targetName ?? c.promoterName),
    status: c.status === 'active' ? 'partnered' : c.status === 'pending' ? 'pending' : 'discover',
    eventsTogether: 0,
    responseTime: 'Unknown',
    accent: 'violet',
  });

  const host: HostRepository = {
    getOrganizations: async () => {
      return [];
    },
    getOverview: async () => {
      throw new Error('Not implemented - use v1 API or implement');
    },
    getEvents: async () => {
      throw new Error('Not implemented - use v1 API or implement');
    },
    getEvent: async () => null,
    getEventAnalytics: async () => null,
    getPartners: async () => {
      const orgId = getOrgId();
      const { items } = await partnershipApi.list(orgId);
      return items.map(mapPartnershipToRelationship);
    },
    getFinance: async () => {
      throw new Error('Not implemented - use v1 API or implement');
    },
    getProfile: async () => {
      throw new Error('Not implemented - use v1 API or implement');
    },
    requestPartnership: async (input) => {
      return partnershipApi.request(input);
    },
    resolvePartnership: async (partnershipId, action, reason) => {
      switch (action) {
        case 'approve':
          return partnershipApi.approve(partnershipId, reason);
        case 'reject':
          return partnershipApi.reject(partnershipId, reason);
        case 'block':
          return partnershipApi.block(partnershipId, reason);
        case 'end':
          return partnershipApi.end(partnershipId);
      }
    },
    getPartnerships: async (params) => {
      const orgId = getOrgId();
      const result = await partnershipApi.list(orgId, {
        limit: params?.limit ?? 20,
        ...(params?.cursor ? { cursor: params.cursor } : {}),
      });
      return { items: result.items, pageInfo: { hasNextPage: result.pageInfo.hasNextPage } };
    },
  };

  const promoter: PromoterRepository = {
    getOverview: async () => {
      return fixturePromoterRepository.getOverview();
    },
    getLinkedEvents: async () => {
      return loadPromoterLinkedEvents();
    },
    discoverEvents: async () => {
      return fixturePromoterRepository.discoverEvents();
    },
    getPartners: async () => {
      try {
        const orgId = getOrgId();
        const { items } = await promoterConnectionApi.list(orgId);
        const mapped = items.map(mapPromoterConnectionToPartner);
        return mapped.length > 0 ? mapped : fixturePromoterRepository.getPartners();
      } catch {
        return fixturePromoterRepository.getPartners();
      }
    },
    getFinance: async () => {
      return fixturePromoterRepository.getFinance();
    },
    getLinks: async () => {
      return fixturePromoterRepository.getLinks();
    },
    getProfile: async () => {
      return fixturePromoterRepository.getProfile();
    },
    getNetworkProfile: async () => {
      return fixturePromoterRepository.getNetworkProfile();
    },
    createTrackingLink: async (input) => {
      return fixturePromoterRepository.createTrackingLink(input);
    },
    requestConnection: async (input) => {
      return promoterConnectionApi.request(input);
    },
    resolveConnection: async (connectionId, action, reason) => {
      switch (action) {
        case 'approve':
          return promoterConnectionApi.approve(connectionId);
        case 'reject':
          return promoterConnectionApi.reject(connectionId, reason);
        case 'block':
          return promoterConnectionApi.block(connectionId, reason);
        case 'revoke':
          return promoterConnectionApi.revoke(connectionId);
      }
    },
    getPromoterConnections: async (params) => {
      const orgId = getOrgId();
      const result = await promoterConnectionApi.list(orgId, {
        limit: params?.limit ?? 20,
        ...(params?.cursor ? { cursor: params.cursor } : {}),
      });
      return { items: result.items, pageInfo: { hasNextPage: result.pageInfo.hasNextPage } };
    },
  };

  return { host, promoter };
}
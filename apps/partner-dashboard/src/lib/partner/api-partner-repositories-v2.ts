import { partnershipApi, promoterConnectionApi } from '@/lib/api/partner-connections';
import { getActiveOrgId } from '@/lib/org/active-org';

import {
  type HostRepository,
  type PromoterRepository,
  type PartnershipDto,
  type PromoterConnectionDto,
  type PartnerRelationship,
  type PromoterPartner,
} from './contracts';
import { fixturePromoterRepository } from './fixture-promoter-repository';

export function createApiPartnerRepositoriesV2(): {
  readonly host: HostRepository;
  readonly promoter: PromoterRepository;
} {
  const getOrgId = (): string => {
    const orgId = getActiveOrgId();
    if (!orgId) throw new Error('No organization ID in session');
    return orgId;
  };

  const assertNever = (value: never): never => {
    throw new Error(`Unsupported action: ${String(value)}`);
  };

  const mapPartnershipToRelationship = (p: PartnershipDto): PartnerRelationship => ({
    id: p.id,
    kind: p.initiatedBy === 'host' ? 'venue' : 'host',
    name:
      p.initiatedBy === 'host'
        ? `Venue ${p.venueId.slice(0, 8)}`
        : `Host ${p.hostOrganizationId.slice(0, 8)}`,
    city: 'Unknown',
    verified: false,
    status: p.status === 'active' ? 'partnered' : p.status === 'pending' ? 'pending' : 'discover',
    eventsTogether: 0,
    responseTime: 'Unknown',
    categories: [],
  });

  const mapPromoterConnectionToPartner = (c: PromoterConnectionDto): PromoterPartner => ({
    id: c.id,
    kind: c.targetType,
    name: `${c.targetType} ${c.targetId.slice(0, 8)}`,
    city: 'Unknown',
    category: 'Unknown',
    verified: false,
    status: c.status === 'active' ? 'partnered' : c.status === 'pending' ? 'pending' : 'discover',
    eventsTogether: 0,
    responseTime: 'Unknown',
    accent: 'violet',
  });

  const host: HostRepository = {
    getOrganizations: () => Promise.resolve([]),
    getOverview: () => Promise.reject(new Error('Not implemented - use v1 API or implement')),
    getEvents: () => Promise.reject(new Error('Not implemented - use v1 API or implement')),
    getEvent: () => Promise.resolve(null),
    getEventAnalytics: () => Promise.resolve(null),
    getPartners: async () => {
      const orgId = getOrgId();
      const { items } = await partnershipApi.list(orgId);
      return items.map(mapPartnershipToRelationship);
    },
    getFinance: () => Promise.reject(new Error('Not implemented - use v1 API or implement')),
    getProfile: () => Promise.reject(new Error('Not implemented - use v1 API or implement')),
    requestPartnership: (input) => {
      return partnershipApi.request(input);
    },
    resolvePartnership: (partnershipId, action, reason) => {
      switch (action) {
        case 'approve':
          return partnershipApi.approve(partnershipId, reason);
        case 'reject':
          return partnershipApi.reject(partnershipId, reason);
        case 'block':
          return partnershipApi.block(partnershipId, reason);
        case 'end':
          return partnershipApi.end(partnershipId);
        default:
          return assertNever(action);
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
      return fixturePromoterRepository.getLinkedEvents();
    },
    discoverEvents: async () => {
      return fixturePromoterRepository.discoverEvents();
    },
    getPartners: async () => {
      try {
        const orgId = getOrgId();
        const { items } = await promoterConnectionApi.list(orgId);
        const mapped = items.map(mapPromoterConnectionToPartner);
        return await (mapped.length > 0 ? mapped : fixturePromoterRepository.getPartners());
      } catch {
        return await fixturePromoterRepository.getPartners();
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
    requestConnection: (input) => {
      return promoterConnectionApi.request(input);
    },
    resolveConnection: (connectionId, action, reason) => {
      switch (action) {
        case 'approve':
          return promoterConnectionApi.approve(connectionId);
        case 'reject':
          return promoterConnectionApi.reject(connectionId, reason);
        case 'block':
          return promoterConnectionApi.block(connectionId, reason);
        case 'revoke':
          return promoterConnectionApi.revoke(connectionId);
        default:
          return assertNever(action);
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

import type {
  CreateTrackingLinkInput,
  EventDiscoveryFilters,
  HostOverview,
  HostRepository,
  PartnerAnalyticsSummary,
  PartnerEventDetail,
  PartnerEventSummary,
  PartnerFinanceSummary,
  PartnerOrganizationSummary,
  PartnerProfile,
  PartnerRelationship,
  PromoterConnectionDto,
  PromoterEvent,
  PromoterFinanceSummary,
  PromoterNetworkProfileData,
  PromoterOverview,
  PromoterPartner,
  PromoterProfile,
  PromoterRepository,
  PromoterTrackingLink,
  PartnershipDto,
} from './contracts';
import type { PartnershipApi, PromoterConnectionApi } from '../api/partner-connections';

type Decoder<T> = (input: unknown) => T;

export interface ApiPartnerDecoders {
  readonly organizations: Decoder<readonly PartnerOrganizationSummary[]>;
  readonly hostOverview: Decoder<HostOverview>;
  readonly hostEvents: Decoder<readonly PartnerEventSummary[]>;
  readonly eventDetail: Decoder<PartnerEventDetail>;
  readonly analytics: Decoder<PartnerAnalyticsSummary>;
  readonly relationships: Decoder<readonly PartnerRelationship[]>;
  readonly hostFinance: Decoder<PartnerFinanceSummary>;
  readonly hostProfile: Decoder<PartnerProfile>;
  readonly promoterOverview: Decoder<PromoterOverview>;
  readonly promoterEvents: Decoder<readonly PromoterEvent[]>;
  readonly promoterPartners: Decoder<readonly PromoterPartner[]>;
  readonly promoterFinance: Decoder<PromoterFinanceSummary>;
  readonly promoterLinks: Decoder<readonly PromoterTrackingLink[]>;
  readonly promoterProfile: Decoder<PromoterProfile>;
  readonly promoterNetworkProfile: Decoder<PromoterNetworkProfileData>;
  readonly promoterTrackingLink: Decoder<PromoterTrackingLink>;
}

export interface ApiPartnerRepositoryOptions {
  readonly decoders: ApiPartnerDecoders;
  readonly transport: PartnerApiTransport;
}

export interface PartnerApiTransport {
  request(path: string, options?: { readonly method?: 'GET' | 'POST' | 'PATCH'; readonly body?: unknown }): Promise<unknown>;
}

export class PartnerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(message);
    this.name = 'PartnerApiError';
  }
}

const withFilters = (path: string, filters?: EventDiscoveryFilters): string => {
  if (!filters) return path;
  const query = new URLSearchParams();
  const entries: readonly (readonly [string, string | undefined])[] = [
    ['query', filters.query], ['city', filters.city], ['category', filters.category],
    ['date', filters.date], ['commissionModel', filters.commissionModel],
    ['venueId', filters.venueId], ['hostId', filters.hostId],
  ];
  entries.forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return query.size ? `${path}?${query.toString()}` : path;
};

export function createApiPartnerRepositories(options: ApiPartnerRepositoryOptions): {
  readonly host: HostRepository;
  readonly promoter: PromoterRepository;
} {
  const request = async <T>(path: string, decoder: Decoder<T>, init?: { readonly method?: 'GET' | 'POST' | 'PATCH'; readonly body?: unknown }): Promise<T> => {
    const payload = await options.transport.request(path, init);
    return decoder(payload);
  };

  const nullable = async <T>(path: string, decoder: Decoder<T>): Promise<T | null> => {
    try {
      return await request(path, decoder);
    } catch (error) {
      if (error instanceof PartnerApiError && error.status === 404) return null;
      throw error;
    }
  };

  const organizations = () => request('/api/v1/partner/organizations', options.decoders.organizations);

  
  /**
   * Partnership / promoter-connection lifecycle (v2 API). The v1 transport has
   * no endpoints for these, so this factory delegates to the same v2 API
   * modules as `createApiPartnerRepositoriesV2` — one real implementation.
   * The modules are loaded lazily so this factory stays import-safe in unit
   * tests (the v2 client validates env at module load).
   */
  const loadPartnershipApi = async (): Promise<PartnershipApi> =>
    (await import('../api/partner-connections')).partnershipApi;

  const loadPromoterConnectionApi = async (): Promise<PromoterConnectionApi> =>
    (await import('../api/partner-connections')).promoterConnectionApi;

  const loadOrgId = async (): Promise<string> => {
    const { getActiveOrgId } = await import('@/lib/org/active-org');
    const orgId = getActiveOrgId();
    if (!orgId) throw new Error('No active organization selected');
    return orgId;
  };

  const partnershipList = (
    params?: { readonly limit?: number; readonly cursor?: string },
  ) => {
    const query = {
      limit: params?.limit ?? 20,
      ...(params?.cursor ? { cursor: params.cursor } : {}),
    };
    return loadOrgId().then((orgId) =>
      loadPartnershipApi().then((api) => api.list(orgId, query)),
    );
  };

  const promoterConnectionList = (
    params?: { readonly limit?: number; readonly cursor?: string },
  ) => {
    const query = {
      limit: params?.limit ?? 20,
      ...(params?.cursor ? { cursor: params.cursor } : {}),
    };
    return loadOrgId().then((orgId) =>
      loadPromoterConnectionApi().then((api) => api.list(orgId, query)),
    );
  };

  const host: HostRepository = {
    getOrganizations: organizations,
    getOverview: () => request('/api/v1/partner/host/overview', options.decoders.hostOverview),
    getEvents: () => request('/api/v1/partner/host/events', options.decoders.hostEvents),
    getEvent: (eventId) => nullable(`/api/v1/partner/events/${encodeURIComponent(eventId)}`, options.decoders.eventDetail),
    getEventAnalytics: (eventId) => nullable(`/api/v1/partner/events/${encodeURIComponent(eventId)}/analytics`, options.decoders.analytics),
    getPartners: () => request('/api/v1/partner/host/partners', options.decoders.relationships),
    getFinance: () => request('/api/v1/partner/host/finance', options.decoders.hostFinance),
    getProfile: () => request('/api/v1/partner/host/profile', options.decoders.hostProfile),
    requestPartnership: async (input) => {
      const api = await loadPartnershipApi();
      const result: PartnershipDto = await api.request(input);
      return result;
    },
    resolvePartnership: async (partnershipId, action, reason) => {
      const api = await loadPartnershipApi();
      switch (action) {
        case 'approve':
          return api.approve(partnershipId, reason);
        case 'reject':
          return api.reject(partnershipId, reason);
        case 'block':
          return api.block(partnershipId, reason);
        case 'end':
          return api.end(partnershipId);
      }
    },
    getPartnerships: async (params) => {
      const result = await partnershipList(params);
      return { items: result.items, pageInfo: { hasNextPage: result.pageInfo.hasNextPage } };
    },
  };

  const promoter: PromoterRepository = {
    getOverview: () => request('/api/v1/partner/promoter/overview', options.decoders.promoterOverview),
    getLinkedEvents: () => request('/api/v1/partner/promoter/events', options.decoders.promoterEvents),
    discoverEvents: (filters) => request(withFilters('/api/v1/partner/promoter/events/discover', filters), options.decoders.promoterEvents),
    getPartners: () => request('/api/v1/partner/promoter/partners', options.decoders.promoterPartners),
    getFinance: () => request('/api/v1/partner/promoter/finance', options.decoders.promoterFinance),
    getLinks: () => request('/api/v1/partner/promoter/links', options.decoders.promoterLinks),
    getProfile: () => request('/api/v1/partner/promoter/profile', options.decoders.promoterProfile),
    getNetworkProfile: () => request('/api/v1/partner/promoter/network-profile', options.decoders.promoterNetworkProfile),
    createTrackingLink: (input: CreateTrackingLinkInput) => request('/api/v1/partner/promoter/links', options.decoders.promoterTrackingLink, { method: 'POST', body: input }),
    requestConnection: async (input) => {
      const api = await loadPromoterConnectionApi();
      const result: PromoterConnectionDto = await api.request(input);
      return result;
    },
    resolveConnection: async (connectionId, action, reason) => {
      const api = await loadPromoterConnectionApi();
      switch (action) {
        case 'approve':
          return api.approve(connectionId);
        case 'reject':
          return api.reject(connectionId, reason);
        case 'block':
          return api.block(connectionId, reason);
        case 'revoke':
          return api.revoke(connectionId);
      }
    },
    getPromoterConnections: async (params) => {
      const result = await promoterConnectionList(params);
      return { items: result.items, pageInfo: { hasNextPage: result.pageInfo.hasNextPage } };
    },
  };

  return { host, promoter };
}

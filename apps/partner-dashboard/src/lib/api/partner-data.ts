import { paginatedSchema } from '@c1rcle/api-client';
import {
  discoverPartnerDtoSchema,
  partnershipDtoSchema,
  promoterConnectionDtoSchema,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { getStaffFromApi } from '@/data/api-partner-data-source';
import {
  toHostPartnersData,
  toPromoterPartnersData,
  toVenuePartnersData,
} from '@/lib/partner/studio-partners-view-model';

import type {
  HostPartnersData,
  PromoterPartnersData,
  VenuePartnersData,
} from '@/data/partner-data-source';
import type {
  DiscoverPartnerDto,
  DiscoverPartnerKind,
  PartnershipDto,
  PromoterConnectionDto,
} from '@c1rcle/contracts';

function orgHeaders(organizationId: string): Record<string, string> {
  return { 'x-organization-id': organizationId };
}

async function getOrgId(): Promise<string> {
  const { getActiveOrgId } = await import('@/lib/org/active-org');
  const id = getActiveOrgId();
  if (!id) throw new Error('No active organization selected');
  return id;
}

/** Venue ↔ host edges the organization is party to, either direction. */
export async function getPartnerships(): Promise<readonly PartnershipDto[]> {
  const organizationId = await getOrgId();
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partnerships`,
    schema: paginatedSchema(partnershipDtoSchema),
    headers: orgHeaders(organizationId),
  });
  return response.items;
}

/** Promoter ↔ host/venue edges the organization is party to. */
export async function getPromoterConnections(): Promise<readonly PromoterConnectionDto[]> {
  const organizationId = await getOrgId();
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/promoter-connections?limit=100`,
    schema: paginatedSchema(promoterConnectionDtoSchema),
    headers: orgHeaders(organizationId),
  });
  return response.items;
}

/** Real organizations/venues the caller's org could connect with. */
export async function getDiscoverablePartners(
  query: { readonly type?: DiscoverPartnerKind; readonly q?: string } = {},
): Promise<readonly DiscoverPartnerDto[]> {
  const organizationId = await getOrgId();
  const params = new URLSearchParams();
  if (query.type) params.set('type', query.type);
  if (query.q) params.set('q', query.q);
  params.set('limit', '100');
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/discover-partners?${params.toString()}`,
    schema: paginatedSchema(discoverPartnerDtoSchema),
    headers: orgHeaders(organizationId),
  });
  return response.items;
}

/** Venue ↔ host edges the organization is party to, either direction. */
export async function getPartnershipsForOrg(
  organizationId: string,
): Promise<readonly PartnershipDto[]> {
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partnerships`,
    schema: paginatedSchema(partnershipDtoSchema),
    headers: { 'x-organization-id': organizationId },
  });
  return response.items;
}

/** Promoter ↔ host/venue edges the organization is party to. */
export async function getPromoterConnectionsForOrg(
  organizationId: string,
): Promise<readonly PromoterConnectionDto[]> {
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/promoter-connections?limit=100`,
    schema: paginatedSchema(promoterConnectionDtoSchema),
    headers: { 'x-organization-id': organizationId },
  });
  return response.items;
}

/** Real organizations/venues the caller's org could connect with. */
export async function getDiscoverablePartnersForOrg(
  organizationId: string,
  query: { readonly type?: DiscoverPartnerKind; readonly q?: string } = {},
): Promise<readonly DiscoverPartnerDto[]> {
  const params = new URLSearchParams();
  if (query.type) params.set('type', query.type);
  if (query.q) params.set('q', query.q);
  params.set('limit', '100');
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/discover-partners?${params.toString()}`,
    schema: paginatedSchema(discoverPartnerDtoSchema),
    headers: { 'x-organization-id': organizationId },
  });
  return response.items;
}

export type { PartnershipDto, PromoterConnectionDto, DiscoverPartnerDto, DiscoverPartnerKind };

function buildDiscoverQuery(
  type: DiscoverPartnerKind | undefined,
  search: string,
): { readonly type?: DiscoverPartnerKind; readonly q?: string } {
  if (type && search) return { type, q: search };
  if (type) return { type };
  if (search) return { q: search };
  return {};
}

/** Venue studio: hosts + promoters from partnerships/promoter-connections + discover + staff. */
export async function getVenuePartnersData(search = ''): Promise<VenuePartnersData> {
  const organizationId = await getOrgId();
  const [partnerships, promoterConnections, discoveredHosts, discoveredPromoters, staffSlice] =
    await Promise.all([
      getPartnerships(),
      getPromoterConnections(),
      getDiscoverablePartners(buildDiscoverQuery('host', search)),
      getDiscoverablePartners(buildDiscoverQuery('promoter', search)),
      getStaffFromApi(organizationId).catch(() => ({
        staff: [],
        staffInvites: [],
        staffAccess: { canManage: true },
      })),
    ]);
  const base = toVenuePartnersData({
    partnerships,
    promoterConnections,
    discoveredHosts,
    discoveredPromoters,
  });
  return {
    ...base,
    staff: staffSlice.staff,
    staffInvites: staffSlice.staffInvites,
    staffAccess: staffSlice.staffAccess,
  };
}

/** Host studio: venues + promoters from partnerships/promoter-connections + discover + staff. */
export async function getHostPartnersData(search = ''): Promise<HostPartnersData> {
  const organizationId = await getOrgId();
  const [partnerships, promoterConnections, discoveredVenues, discoveredPromoters, staffSlice] =
    await Promise.all([
      getPartnerships(),
      getPromoterConnections(),
      getDiscoverablePartners(buildDiscoverQuery('venue', search)),
      getDiscoverablePartners(buildDiscoverQuery('promoter', search)),
      getStaffFromApi(organizationId).catch(() => ({
        staff: [],
        staffInvites: [],
        staffAccess: { canManage: true },
      })),
    ]);
  const base = toHostPartnersData({
    partnerships,
    promoterConnections,
    discoveredVenues,
    discoveredPromoters,
  });
  return {
    ...base,
    staff: staffSlice.staff,
    staffInvites: staffSlice.staffInvites,
    staffAccess: staffSlice.staffAccess,
  };
}

/** Promoter studio: connections + discover. */
export async function getPromoterPartnersData(search = ''): Promise<PromoterPartnersData> {
  const organizationId = await getOrgId();
  const [promoterConnections, discovered] = await Promise.all([
    getPromoterConnections(),
    getDiscoverablePartners(buildDiscoverQuery(undefined, search)),
  ]);
  return toPromoterPartnersData({
    organizationId,
    promoterConnections,
    discovered,
  });
}

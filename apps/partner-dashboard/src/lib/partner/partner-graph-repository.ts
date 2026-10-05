import {
  discoverPartnerDtoSchema,
  paginatedSchema,
  partnershipDtoSchema,
  promoterConnectionDtoSchema,
} from '@c1rcle/contracts';

import type {
  DiscoverPartnerDto,
  DiscoverPartnerKind,
  PartnershipDto,
  PromoterConnectionDto,
} from '@c1rcle/contracts';
import type { z } from 'zod';

/**
 * The slice of the API client these reads need. Declared structurally so the
 * same repository serves the studio partners Server Components (per-request
 * cookie client from `@/lib/api/server-client`) without importing either
 * auth state. Mirrors `OverviewApiClient`: the client is always an explicit
 * argument, never a module import.
 */
export interface PartnerGraphApiClient {
  get<T>(options: {
    path: string;
    schema: z.ZodType<T>;
    headers?: Record<string, string>;
  }): Promise<T>;
}

function orgPath(organizationId: string, suffix: string): string {
  return `/api/v2/organizations/${encodeURIComponent(organizationId)}${suffix}`;
}

function orgHeaders(organizationId: string): Record<string, string> {
  return { 'x-organization-id': organizationId };
}

/** Venue ↔ host edges the organization is party to, either direction. */
export async function getPartnerships(
  client: PartnerGraphApiClient,
  organizationId: string,
): Promise<readonly PartnershipDto[]> {
  const response = await client.get({
    path: orgPath(organizationId, '/partnerships'),
    schema: paginatedSchema(partnershipDtoSchema),
    headers: orgHeaders(organizationId),
  });
  return response.items;
}

/** Promoter ↔ host/venue edges the organization is party to. */
export async function getPromoterConnections(
  client: PartnerGraphApiClient,
  organizationId: string,
): Promise<readonly PromoterConnectionDto[]> {
  const response = await client.get({
    path: orgPath(organizationId, '/promoter-connections?limit=100'),
    schema: paginatedSchema(promoterConnectionDtoSchema),
    headers: orgHeaders(organizationId),
  });
  return response.items;
}

/** Real organizations/venues the caller's org could connect with. */
export async function getDiscoverablePartners(
  client: PartnerGraphApiClient,
  organizationId: string,
  query: { readonly type?: DiscoverPartnerKind; readonly q?: string } = {},
): Promise<readonly DiscoverPartnerDto[]> {
  const params = new URLSearchParams();
  if (query.type) params.set('type', query.type);
  if (query.q) params.set('q', query.q);
  params.set('limit', '100');
  const response = await client.get({
    path: `${orgPath(organizationId, '/discover-partners')}?${params.toString()}`,
    schema: paginatedSchema(discoverPartnerDtoSchema),
    headers: orgHeaders(organizationId),
  });
  return response.items;
}

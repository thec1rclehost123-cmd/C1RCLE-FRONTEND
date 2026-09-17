import {
  partnershipDtoSchema,
  promoterConnectionDtoSchema,
  paginatedSchema,
  type PartnershipDto,
  type RequestPartnershipRequest,
  type ResolvePartnershipRequest,
  type PromoterConnectionDto,
  type RequestConnectionRequest,
  type PaginationQuery,
  type Paginated,
} from '@c1rcle/contracts/client';

import { getActiveOrgId } from '@/lib/org/active-org';

import { apiClient } from './client';

const partnershipListSchema = paginatedSchema(partnershipDtoSchema);
const promoterConnectionListSchema = paginatedSchema(promoterConnectionDtoSchema);

function getIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  return getActiveOrgId();
}

export interface PartnershipApi {
  list(organizationId: string, params?: PaginationQuery): Promise<Paginated<PartnershipDto>>;
  request(body: RequestPartnershipRequest): Promise<PartnershipDto>;
  approve(partnershipId: string, reason?: string): Promise<PartnershipDto>;
  reject(partnershipId: string, reason?: string): Promise<PartnershipDto>;
  block(partnershipId: string, reason?: string): Promise<PartnershipDto>;
  end(partnershipId: string): Promise<PartnershipDto>;
}

export interface PromoterConnectionApi {
  list(organizationId: string, params?: PaginationQuery): Promise<Paginated<PromoterConnectionDto>>;
  request(body: RequestConnectionRequest): Promise<PromoterConnectionDto>;
  approve(connectionId: string): Promise<PromoterConnectionDto>;
  reject(connectionId: string, reason?: string): Promise<PromoterConnectionDto>;
  block(connectionId: string, reason?: string): Promise<PromoterConnectionDto>;
  revoke(connectionId: string): Promise<PromoterConnectionDto>;
}

function buildHeaders(includeIdempotency = true): Record<string, string> {
  // NOTE: 'content-type' is intentionally omitted here.
  // The shared API client (packages/api-client) adds 'content-type: application/json'
  // only when a request body is present. Adding it here unconditionally caused
  // Fastify to reject bodyless action POSTs (approve, revoke, end) with
  // "Body cannot be empty when content-type is set to 'application/json'".
  const headers: Record<string, string> = {};
  const orgId = getOrgId();
  if (orgId) {
    headers['x-organization-id'] = orgId;
  }
  if (includeIdempotency) {
    headers['idempotency-key'] = getIdempotencyKey();
  }
  return headers;
}

export const partnershipApi: PartnershipApi = {
  list: (organizationId, params) =>
    apiClient.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partnerships`,
      query: {
        limit: params?.limit ?? 20,
        ...(params?.cursor ? { cursor: params.cursor } : {}),
      },
      headers: buildHeaders(false),
      schema: partnershipListSchema,
    }),

  request: (body) =>
    apiClient.post({
      path: '/api/v2/partnerships',
      body,
      headers: buildHeaders(),
      schema: partnershipDtoSchema,
    }),

  approve: (partnershipId, reason) =>
    apiClient.post({
      path: `/api/v2/partnerships/${encodeURIComponent(partnershipId)}/approve`,
      body: reason ? { reason } : undefined,
      headers: buildHeaders(),
      schema: partnershipDtoSchema,
    }),

  reject: (partnershipId, reason) =>
    apiClient.post({
      path: `/api/v2/partnerships/${encodeURIComponent(partnershipId)}/reject`,
      body: reason ? { reason } : undefined,
      headers: buildHeaders(),
      schema: partnershipDtoSchema,
    }),

  block: (partnershipId, reason) =>
    apiClient.post({
      path: `/api/v2/partnerships/${encodeURIComponent(partnershipId)}/block`,
      body: reason ? { reason } : undefined,
      headers: buildHeaders(),
      schema: partnershipDtoSchema,
    }),

  end: (partnershipId) =>
    apiClient.post({
      path: `/api/v2/partnerships/${encodeURIComponent(partnershipId)}/end`,
      headers: buildHeaders(),
      schema: partnershipDtoSchema,
    }),
};

export const promoterConnectionApi: PromoterConnectionApi = {
  list: (organizationId, params) =>
    apiClient.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/promoter-connections`,
      query: {
        limit: params?.limit ?? 20,
        ...(params?.cursor ? { cursor: params.cursor } : {}),
      },
      headers: buildHeaders(false),
      schema: promoterConnectionListSchema,
    }),

  request: (body) =>
    apiClient.post({
      path: '/api/v2/promoter-connections',
      body,
      headers: buildHeaders(),
      schema: promoterConnectionDtoSchema,
    }),

  approve: (connectionId) =>
    apiClient.post({
      path: `/api/v2/promoter-connections/${encodeURIComponent(connectionId)}/approve`,
      headers: buildHeaders(),
      schema: promoterConnectionDtoSchema,
    }),

  reject: (connectionId, reason) =>
    apiClient.post({
      path: `/api/v2/promoter-connections/${encodeURIComponent(connectionId)}/reject`,
      body: reason ? { reason } : undefined,
      headers: buildHeaders(),
      schema: promoterConnectionDtoSchema,
    }),

  block: (connectionId, reason) =>
    apiClient.post({
      path: `/api/v2/promoter-connections/${encodeURIComponent(connectionId)}/block`,
      body: reason ? { reason } : undefined,
      headers: buildHeaders(),
      schema: promoterConnectionDtoSchema,
    }),

  revoke: (connectionId) =>
    apiClient.post({
      path: `/api/v2/promoter-connections/${encodeURIComponent(connectionId)}/revoke`,
      headers: buildHeaders(),
      schema: promoterConnectionDtoSchema,
    }),
};

export type { PartnershipDto, RequestPartnershipRequest, ResolvePartnershipRequest, PromoterConnectionDto, RequestConnectionRequest, PaginationQuery, Paginated };
import { organizationDtoSchema, paginatedSchema, partnerAccessDtoSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { bffClient } from '@/lib/bff/bff-client';

import type {
  CreateOrganizationInput,
  OrganizationDto,
  PartnerAccessDto,
} from '@c1rcle/contracts';

/**
 * Fetches all organizations the logged-in user has access to, through the
 * same-origin BFF (session-cookie auth — the BFF re-emits the browser's
 * cookie to the gateway, so no in-memory bearer token is required).
 */
export async function getOrganizations(): Promise<OrganizationDto[]> {
  const response = await bffClient.get({
    path: '/api/bff/organizations',
    schema: paginatedSchema(organizationDtoSchema),
  });
  return response.items;
}

/**
 * Server-computed role/permissions/tabVisibility for one organization. Same
 * endpoint `useOrgAccess` calls for the *active* org — exposed here as a
 * plain function too so a membership list (many orgs, not just the active
 * one) can resolve each org's `partnerType` without a hook-in-a-loop.
 */
export async function getPartnerAccess(organizationId: string): Promise<PartnerAccessDto> {
  return bffClient.get({
    path: `/api/bff/organizations/${organizationId}/access`,
    schema: partnerAccessDtoSchema,
    headers: { 'x-organization-id': organizationId },
  });
}

/**
 * Creates a new organization.
 */
export async function createOrganization(input: CreateOrganizationInput): Promise<OrganizationDto> {
  const idempotencyKey = crypto.randomUUID();
  return apiClient.post({
    path: '/api/v2/organizations',
    body: input,
    schema: organizationDtoSchema,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
}

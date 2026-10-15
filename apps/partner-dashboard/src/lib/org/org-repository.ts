import { organizationDtoSchema, paginatedSchema, partnerAccessDtoSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { bffClient } from '@/lib/bff/bff-client';

import type { CreateOrganizationInput, OrganizationDto, PartnerAccessDto } from '@c1rcle/contracts';

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
  });
}

/**
 * Creates a new organization.
 *
 * B2: `idempotencyKey` is minted once per create intent by the caller's flow
 * and re-used across retries; the fallback mint must not be used by a
 * retrying caller (a fresh key on retry could double-create after a partial
 * failure).
 */
export async function createOrganization(
  input: CreateOrganizationInput,
  idempotencyKey?: string,
): Promise<OrganizationDto> {
  return apiClient.post({
    path: '/api/v2/organizations',
    body: input,
    schema: organizationDtoSchema,
    headers: {
      'Idempotency-Key': idempotencyKey ?? crypto.randomUUID(),
    },
  });
}

import { organizationDtoSchema, paginatedSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import type { CreateOrganizationInput, OrganizationDto } from '@c1rcle/contracts';

/**
 * Fetches all organizations the logged-in user has access to.
 */
export async function getOrganizations(): Promise<OrganizationDto[]> {
  const response = await apiClient.get({
    path: '/api/v2/organizations',
    schema: paginatedSchema(organizationDtoSchema),
  });
  return response.items;
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

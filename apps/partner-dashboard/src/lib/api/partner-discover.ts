import {
  discoverPartnerDtoSchema,
  paginatedSchema,
  venueDtoSchema,
  type DiscoverPartnerDto,
  type VenueDto,
} from '@c1rcle/contracts/client';

import { getActiveOrgId } from '@/lib/org/active-org';

import { apiClient } from './client';

const discoverListSchema = paginatedSchema(discoverPartnerDtoSchema);
const venueListSchema = paginatedSchema(venueDtoSchema);

export type { DiscoverPartnerDto, VenueDto };

function getOrgId(): string {
  const id = getActiveOrgId();
  if (!id) throw new Error('No active organization selected');
  return id;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  const orgId = getActiveOrgId();
  if (orgId) headers['x-organization-id'] = orgId;
  return headers;
}

export type DiscoverKind = 'host' | 'venue' | 'promoter';

/**
 * Real backend browse — never dummy profiles. Empty database yields an empty
 * list, which the UI renders as an empty state.
 */
export async function fetchDiscoverPartners(options?: {
  readonly type?: DiscoverKind;
  readonly q?: string;
  readonly limit?: number;
}): Promise<DiscoverPartnerDto[]> {
  const orgId = getOrgId();
  const query: Record<string, string | number> = {
    limit: options?.limit ?? 20,
  };
  if (options?.type) query['type'] = options.type;
  if (options?.q?.trim()) query['q'] = options.q.trim();
  const result = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(orgId)}/discover-partners`,
    query,
    headers: buildHeaders(),
    schema: discoverListSchema,
  });
  return result.items;
}

/** Own venues of the active org (needed when a venue invites a host). */
export async function fetchOwnVenues(): Promise<VenueDto[]> {
  const orgId = getOrgId();
  const result = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(orgId)}/venues`,
    query: { limit: 50 },
    headers: buildHeaders(),
    schema: venueListSchema,
  });
  return result.items.filter((venue) => venue.status === 'active');
}

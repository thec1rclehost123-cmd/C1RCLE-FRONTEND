import { eventDtoSchema, paginatedSchema } from '@c1rcle/contracts/client';

import { getActiveOrgId } from '@/lib/org/active-org';

import { apiClient } from './client';

import type { EventDto } from '@c1rcle/contracts/client';

const eventListSchema = paginatedSchema(eventDtoSchema);

export type { EventDto };

function getOrgId(): string {
  const id = getActiveOrgId();
  if (!id) throw new Error('No active organization selected');
  return id;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const orgId = getActiveOrgId();
  if (orgId) headers['x-organization-id'] = orgId;
  return headers;
}

/**
 * Lists the active org's events (first page, up to `limit`).
 *
 * Maps to: GET /api/v2/organizations/:organizationId/events
 * Permission: event.read
 *
 * Callers filter client-side (venue, month window) — the route has no
 * date-range query, and a month view never needs more than a page.
 */
export async function listOrgEvents(options?: {
  readonly limit?: number;
}): Promise<EventDto[]> {
  const orgId = getOrgId();
  const result = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(orgId)}/events`,
    query: { limit: options?.limit ?? 100 },
    headers: buildHeaders(),
    schema: eventListSchema,
  });
  return result.items;
}

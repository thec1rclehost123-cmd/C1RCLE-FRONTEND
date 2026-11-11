import { z } from 'zod';

import {
  eventDraftRequestSchema,
  eventDraftResponseSchema,
  eventDraftDtoSchema,
} from '@c1rcle/contracts/client';

import { apiClient } from '@/lib/api/client';

const pathFor = (organizationId: string) =>
  `/api/v2/organizations/${encodeURIComponent(organizationId)}/event-draft`;

export async function getHostEventDraft(organizationId: string) {
  return apiClient.get({ path: pathFor(organizationId), schema: eventDraftResponseSchema });
}

export async function saveHostEventDraft(organizationId: string, data: Record<string, unknown>) {
  const body = eventDraftRequestSchema.parse({ schemaVersion: 1, data });
  return apiClient.put({ path: pathFor(organizationId), body, schema: eventDraftDtoSchema });
}

export async function discardHostEventDraft(organizationId: string) {
  await apiClient.delete({ path: pathFor(organizationId), schema: z.undefined() });
}

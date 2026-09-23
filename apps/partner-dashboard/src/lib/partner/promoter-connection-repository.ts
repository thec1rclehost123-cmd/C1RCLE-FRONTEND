import { paginatedSchema } from '@c1rcle/api-client';
import {
  promoterConnectionDtoSchema,
  type PromoterConnectionDto,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

export async function loadConnectedPromoterConnections({
  organizationId,
  signal,
}: {
  readonly organizationId: string;
  readonly signal?: AbortSignal;
}): Promise<readonly PromoterConnectionDto[]> {
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/promoter-connections`,
    query: { limit: 100 },
    headers: { 'x-organization-id': organizationId },
    schema: paginatedSchema(promoterConnectionDtoSchema),
    ...(signal ? { signal } : {}),
  });

  return response.items.filter((connection) => connection.status === 'active');
}

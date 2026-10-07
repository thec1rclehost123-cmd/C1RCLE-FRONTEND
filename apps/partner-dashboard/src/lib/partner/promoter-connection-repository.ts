import { paginatedSchema } from '@c1rcle/api-client';
import {
  promoterConnectionDtoSchema,
  type PromoterConnectionDto,
  type RequestConnectionRequest,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

export type PromoterConnectionAction = 'approve' | 'reject' | 'block' | 'revoke';

function orgHeaders(organizationId: string): Record<string, string> {
  return { 'X-Organization-Id': organizationId };
}

function commandHeaders(organizationId: string, idempotencyKey?: string): Record<string, string> {
  return {
    ...orgHeaders(organizationId),
    'Idempotency-Key': idempotencyKey ?? crypto.randomUUID(),
  };
}

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

/**
 * Every promoter connection the organization is party to. Unlike
 * {@link loadConnectedPromoterConnections} this keeps all statuses so the
 * Requests tab can render pending/rejected rows and offer answers.
 */
export async function listPromoterConnections({
  organizationId,
  signal,
}: {
  readonly organizationId: string;
  readonly signal?: AbortSignal;
}): Promise<readonly PromoterConnectionDto[]> {
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/promoter-connections`,
    query: { limit: 100 },
    headers: orgHeaders(organizationId),
    schema: paginatedSchema(promoterConnectionDtoSchema),
    ...(signal ? { signal } : {}),
  });

  return response.items;
}

/**
 * Opens a promoter-connection request. One key per user intent — a retried
 * intent replays the key instead of opening a duplicate request.
 */
export async function requestPromoterConnection(
  organizationId: string,
  input: RequestConnectionRequest,
  idempotencyKey?: string,
): Promise<PromoterConnectionDto> {
  return apiClient.post({
    path: '/api/v2/promoter-connections',
    body: input,
    schema: promoterConnectionDtoSchema,
    headers: commandHeaders(organizationId, idempotencyKey),
  });
}

/**
 * `approve`/`reject` are the recipient's answer; `revoke` is the promoter's
 * alone; `block` is open to either side. The backend rejects illegal
 * combinations, so the screen only offers verbs that fit the actor + status.
 */
export async function resolvePromoterConnection(
  organizationId: string,
  connectionId: string,
  action: PromoterConnectionAction,
  options: { readonly reason?: string; readonly idempotencyKey?: string } = {},
): Promise<PromoterConnectionDto> {
  return apiClient.post({
    path: `/api/v2/promoter-connections/${encodeURIComponent(connectionId)}/${action}`,
    body: options.reason ? { reason: options.reason } : {},
    schema: promoterConnectionDtoSchema,
    headers: commandHeaders(organizationId, options.idempotencyKey),
  });
}

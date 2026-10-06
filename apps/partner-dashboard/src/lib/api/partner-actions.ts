import { apiClient } from '@/lib/api/client';
import { paginatedSchema } from '@c1rcle/api-client';
import {
  partnershipDtoSchema,
  promoterConnectionDtoSchema,
} from '@c1rcle/contracts';

import type { PartnershipDto, PromoterConnectionDto } from '@c1rcle/contracts';

import { z } from 'zod';

function commandHeaders(organizationId: string, idempotencyKey?: string): Record<string, string> {
  return {
    'X-Organization-Id': organizationId,
    'Idempotency-Key': idempotencyKey ?? crypto.randomUUID(),
  };
}

async function getOrgId(): Promise<string> {
  const { getActiveOrgId } = await import('@/lib/org/active-org');
  const id = getActiveOrgId();
  if (!id) throw new Error('No active organization selected');
  return id;
}

/**
 * Sends a venue↔host partnership request with the correct side semantics:
 * - host invites venue: `{ venueId, initiatedBy: 'host' }`
 * - venue invites host: `{ venueId: <own venue>, initiatedBy: 'venue',
 *   hostOrganizationId: <candidate host org> }`
 */
export async function sendPartnershipRequest(options: {
  readonly studio: 'venue' | 'host';
  readonly candidateVenueId?: string | null;
  readonly candidateOrganizationId?: string | null;
  readonly message?: string;
}) {
  const organizationId = await getOrgId();

  if (options.studio === 'host') {
    if (!options.candidateVenueId) throw new Error('Select a venue to connect with');
    return apiClient.post({
      path: '/api/v2/partnerships',
      body: {
        venueId: options.candidateVenueId,
        initiatedBy: 'host',
        ...(options.message ? { message: options.message } : {}),
      },
      schema: partnershipDtoSchema,
      headers: commandHeaders(organizationId),
    });
  }
  if (!options.candidateOrganizationId) throw new Error('Select a host to invite');
  const ownVenues = await fetchOwnVenues();
  const venueId = ownVenues[0]?.id;
  if (!venueId) throw new Error('Create a venue before inviting hosts');
  return apiClient.post({
    path: '/api/v2/partnerships',
    body: {
      venueId,
      initiatedBy: 'venue',
      hostOrganizationId: options.candidateOrganizationId,
      ...(options.message ? { message: options.message } : {}),
    },
    schema: partnershipDtoSchema,
    headers: commandHeaders(organizationId),
  });
}

/**
 * Sends a promoter↔host/venue connection request with valid enums:
 * `initiatedBy` is only `'promoter' | 'target'` and `targetType` names the
 * counterparty side (`'host' | 'venue'`).
 */
export async function sendPromoterConnectionRequest(options: {
  readonly studio: 'venue' | 'host' | 'promoter';
  readonly candidateKind: 'venue' | 'host' | 'promoter';
  readonly candidateOrganizationId?: string | null;
  readonly candidateVenueId?: string | null;
  readonly message?: string;
}) {
  const organizationId = await getOrgId();
  const message = options.message ? { message: options.message } : {};

  if (options.studio === 'promoter') {
    // Promoter opens the conversation with a venue/host org.
    const counterpartyId = options.candidateOrganizationId;
    if (!counterpartyId) throw new Error('Select a venue or host to connect with');
    const targetType = options.candidateKind === 'venue' ? ('venue' as const) : ('host' as const);
    return apiClient.post({
      path: '/api/v2/promoter-connections',
      body: {
        counterpartyId,
        targetType,
        initiatedBy: 'promoter',
        ...message,
      },
      schema: promoterConnectionDtoSchema,
      headers: commandHeaders(organizationId),
    });
  }
  // Venue/host invites a promoter org.
  if (options.candidateKind !== 'promoter' || !options.candidateOrganizationId) {
    throw new Error('Select a promoter to invite');
  }
  const targetType = options.studio === 'venue' ? ('venue' as const) : ('host' as const);
  return apiClient.post({
    path: '/api/v2/promoter-connections',
    body: {
      counterpartyId: options.candidateOrganizationId,
      targetType,
      initiatedBy: 'target',
      ...message,
    },
    schema: promoterConnectionDtoSchema,
    headers: commandHeaders(organizationId),
  });
}

async function fetchOwnVenues(): Promise<readonly { id: string }[]> {
  const organizationId = await getOrgId();
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/venues`,
    schema: paginatedSchema(z.object({ id: z.string() })),
  });
  return response.items;
}

export async function resolvePartnershipRequest(
  requestId: string,
  kind: 'host' | 'venue' | 'promoter',
  action: 'approve' | 'reject',
  reason?: string,
) {
  const organizationId = await getOrgId();
  if (kind === 'promoter') {
    return action === 'approve'
      ? approvePromoterConnection(requestId)
      : rejectPromoterConnection(requestId, reason);
  }
  return action === 'approve'
    ? approvePartnership(requestId, reason)
    : rejectPartnership(requestId, reason);
}

export async function resolvePromoterRequest(
  requestId: string,
  action: 'approve' | 'reject',
  reason?: string,
) {
  return action === 'approve'
    ? approvePromoterConnection(requestId)
    : rejectPromoterConnection(requestId, reason);
}

async function approvePartnership(partnershipId: string, reason?: string): Promise<{}> {
  const organizationId = await getOrgId();
  return apiClient.post({
    path: `/api/v2/partnerships/${encodeURIComponent(partnershipId)}/approve`,
    body: reason ? { reason } : undefined,
    schema: partnershipDtoSchema,
    headers: commandHeaders(organizationId),
  });
}

async function rejectPartnership(partnershipId: string, reason?: string): Promise<{}> {
  const organizationId = await getOrgId();
  return apiClient.post({
    path: `/api/v2/partnerships/${encodeURIComponent(partnershipId)}/reject`,
    body: reason ? { reason } : undefined,
    schema: partnershipDtoSchema,
    headers: commandHeaders(organizationId),
  });
}

async function approvePromoterConnection(connectionId: string): Promise<{}> {
  const organizationId = await getOrgId();
  return apiClient.post({
    path: `/api/v2/promoter-connections/${encodeURIComponent(connectionId)}/approve`,
    schema: promoterConnectionDtoSchema,
    headers: commandHeaders(organizationId),
  });
}

async function rejectPromoterConnection(connectionId: string, reason?: string): Promise<{}> {
  const organizationId = await getOrgId();
  return apiClient.post({
    path: `/api/v2/promoter-connections/${encodeURIComponent(connectionId)}/reject`,
    body: reason ? { reason } : undefined,
    schema: promoterConnectionDtoSchema,
    headers: commandHeaders(organizationId),
  });
}
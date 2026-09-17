import { partnershipApi, promoterConnectionApi } from './partner-connections';
import { fetchOwnVenues } from './partner-discover';

import type { PartnerKind } from '@/data/partner-data-source';

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
  if (options.studio === 'host') {
    if (!options.candidateVenueId) throw new Error('Select a venue to connect with');
    return partnershipApi.request({
      venueId: options.candidateVenueId,
      initiatedBy: 'host',
      ...(options.message ? { message: options.message } : {}),
    });
  }
  if (!options.candidateOrganizationId) throw new Error('Select a host to invite');
  const ownVenues = await fetchOwnVenues();
  const venueId = ownVenues[0]?.id;
  if (!venueId) throw new Error('Create a venue before inviting hosts');
  return partnershipApi.request({
    venueId,
    initiatedBy: 'venue',
    hostOrganizationId: options.candidateOrganizationId,
    ...(options.message ? { message: options.message } : {}),
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
  const message = options.message ? { message: options.message } : {};
  if (options.studio === 'promoter') {
    // Promoter opens the conversation with a venue/host org.
    const counterpartyId = options.candidateOrganizationId;
    if (!counterpartyId) throw new Error('Select a venue or host to connect with');
    const targetType = options.candidateKind === 'venue' ? ('venue' as const) : ('host' as const);
    return promoterConnectionApi.request({
      counterpartyId,
      targetType,
      initiatedBy: 'promoter',
      ...message,
    });
  }
  // Venue/host invites a promoter org.
  if (options.candidateKind !== 'promoter' || !options.candidateOrganizationId) {
    throw new Error('Select a promoter to invite');
  }
  const targetType = options.studio === 'venue' ? ('venue' as const) : ('host' as const);
  return promoterConnectionApi.request({
    counterpartyId: options.candidateOrganizationId,
    targetType,
    initiatedBy: 'target',
    ...message,
  });
}

export async function resolvePartnershipRequest(
  requestId: string,
  kind: PartnerKind,
  action: 'approve' | 'reject',
  reason?: string,
) {
  if (kind === 'promoter') {
    return action === 'approve'
      ? promoterConnectionApi.approve(requestId)
      : promoterConnectionApi.reject(requestId, reason);
  }
  return action === 'approve'
    ? partnershipApi.approve(requestId, reason)
    : partnershipApi.reject(requestId, reason);
}

export async function resolvePromoterRequest(
  requestId: string,
  action: 'approve' | 'reject',
  reason?: string,
) {
  return action === 'approve'
    ? promoterConnectionApi.approve(requestId)
    : promoterConnectionApi.reject(requestId, reason);
}

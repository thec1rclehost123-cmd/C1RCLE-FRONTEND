import {
  assignPromoterSchema,
  promoterAssignmentDtoSchema,
  promoterAssignmentRevokeSchema,
  referralLinkDtoSchema,
  promoterAttributedOrderListResponseSchema,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { getActiveOrgId } from '@/lib/org/active-org';

function commandHeaders(organizationId: string, idempotencyKey?: string) {
  return {
    'X-Organization-Id': organizationId,
    'Idempotency-Key': idempotencyKey ?? crypto.randomUUID(),
  };
}

function currentOrganizationId(): string {
  const organizationId = getActiveOrgId();
  if (!organizationId) throw new Error('Select a Promoter organization before continuing.');
  return organizationId;
}

export function respondToPromoterAssignment(input: {
  assignmentId: string;
  expectedVersion: number;
  decision: 'accept' | 'reject';
  idempotencyKey?: string;
}) {
  const organizationId = currentOrganizationId();
  return apiClient.post({
    path: `/api/v2/promoter-assignments/${encodeURIComponent(input.assignmentId)}/respond`,
    body: { expectedVersion: input.expectedVersion, decision: input.decision },
    headers: commandHeaders(organizationId, input.idempotencyKey),
    schema: promoterAssignmentDtoSchema,
  });
}

export function createPromoterReferralLink(input: {
  assignmentId: string;
  idempotencyKey?: string;
}) {
  const organizationId = currentOrganizationId();
  return apiClient.post({
    path: `/api/v2/promoter-assignments/${encodeURIComponent(input.assignmentId)}/referral-links`,
    body: { label: 'Campaign link' },
    headers: commandHeaders(organizationId, input.idempotencyKey),
    schema: referralLinkDtoSchema,
  });
}

export function deactivatePromoterReferralLink(input: {
  referralLinkId: string;
  idempotencyKey?: string;
}) {
  const organizationId = currentOrganizationId();
  return apiClient.post({
    path: `/api/v2/referral-links/${encodeURIComponent(input.referralLinkId)}/deactivate`,
    body: {},
    headers: commandHeaders(organizationId, input.idempotencyKey),
    schema: referralLinkDtoSchema,
  });
}

export function createEventPromoterAssignment(input: {
  eventId: string;
  promoterId: string;
  ratePercent: number;
  flatPaise: number;
  startsAt: string | null;
  expiresAt: string | null;
  eligibleTierIds: readonly string[];
  idempotencyKey?: string;
}) {
  const organizationId = getActiveOrgId();
  if (!organizationId) throw new Error('Select an organization before inviting a Promoter.');
  const body = assignPromoterSchema.parse({
    promoterId: input.promoterId,
    ratePercent: input.ratePercent,
    flatPaise: input.flatPaise,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    eligibleTierIds: input.eligibleTierIds,
  });
  return apiClient.post({
    path: `/api/v2/events/${encodeURIComponent(input.eventId)}/promoter-assignments`,
    body,
    headers: commandHeaders(organizationId, input.idempotencyKey),
    schema: promoterAssignmentDtoSchema,
  });
}

export function revokeEventPromoterAssignment(input: {
  assignmentId: string;
  expectedVersion: number;
  reason: string;
  idempotencyKey?: string;
}) {
  const organizationId = getActiveOrgId();
  if (!organizationId) throw new Error('Select an organization before managing campaigns.');
  const body = promoterAssignmentRevokeSchema.parse({
    expectedVersion: input.expectedVersion,
    reason: input.reason,
  });
  return apiClient.post({
    path: `/api/v2/promoter-assignments/${encodeURIComponent(input.assignmentId)}/revoke`,
    body,
    headers: commandHeaders(organizationId, input.idempotencyKey),
    schema: promoterAssignmentDtoSchema,
  });
}

export function listEventPromoterAttributedOrders(input: {
  eventId: string;
  promoterId: string;
  cursor?: string;
}) {
  const organizationId = getActiveOrgId();
  if (!organizationId) throw new Error('Select an organization before viewing campaign orders.');
  const query = new URLSearchParams({ limit: '20' });
  if (input.cursor !== undefined) query.set('cursor', input.cursor);
  return apiClient.get({
    path: `/api/v2/events/${encodeURIComponent(input.eventId)}/promoters/${encodeURIComponent(input.promoterId)}/attributed-orders?${query.toString()}`,
    headers: { 'X-Organization-Id': organizationId },
    schema: promoterAttributedOrderListResponseSchema,
  });
}

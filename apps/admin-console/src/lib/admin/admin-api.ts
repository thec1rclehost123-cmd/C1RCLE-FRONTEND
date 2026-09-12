'use client';

/**
 * Typed repository over the gateway's `/api/v2/admin/*` surface, mirroring the
 * contract schemas from `@c1rcle/contracts` (whose generated files come from
 * the backend). Every mutation is idempotency-keyed so a retry after a network
 * blip replays the same command instead of double-executing.
 */
import { z } from 'zod';

import {
  adminEventListResponseSchema,
  adminHostDtoSchema,
  adminHostListResponseSchema,
  adminRefundRequestDtoSchema,
  adminRefundRequestListResponseSchema,
  adminAuditRecordDtoSchema,
  adminUserListResponseSchema,
  adminVenueDtoSchema,
  adminVenueListResponseSchema,
  approveOnboardingResultSchema,
  onboardingRequestDtoSchema,
  paginatedSchema,
  payoutBatchResultSchema,
  payoutListResponseSchema,
  payoutResponseSchema,
  platformAdminDtoSchema,
  proposedActionDtoSchema,
  proposeActionSchema,
  rejectRefundRequestSchema,
  resolveProposalSchema,
  requestRefundSchema,
  reviewOnboardingSchema,
  runPayoutBatchSchema,
} from '@c1rcle/contracts';

import { getAdminApiClient, newIdempotencyKey } from '@/lib/api';

import type {
  AdminAction,
  AdminPayoutStatus,
  AdminRefundRequestStatus,
  AdminRole,
  OnboardingStatus,
  ProposalStatus,
} from '@/lib/admin/contract-types';

/* ─── Local response schemas ───────────────────────────────────────────────── */

const refundOutcomeSchema = z.object({
  request: adminRefundRequestDtoSchema,
});

const adminProposalPageSchema = paginatedSchema(proposedActionDtoSchema);
export type AdminProposalPage = z.infer<typeof adminProposalPageSchema>;

const onboardingPageSchema = paginatedSchema(onboardingRequestDtoSchema);
export type OnboardingPage = z.infer<typeof onboardingPageSchema>;

const adminPageSchema = paginatedSchema(platformAdminDtoSchema);
export type AdminPage = z.infer<typeof adminPageSchema>;

const adminAuditPageSchema = z.object({
  items: z.array(adminAuditRecordDtoSchema),
});
export type AdminAuditPage = z.infer<typeof adminAuditPageSchema>;

export type AdminRefundRequestPage = z.infer<typeof adminRefundRequestListResponseSchema>;
export type RefundOutcome = z.infer<typeof refundOutcomeSchema>;

const AUTHORIZED_ACTION: AdminAction = 'ADMIN_PROVISION';

/* ─── Proposals (dual-control desk) ────────────────────────────────────────── */

export function listProposals(
  status: ProposalStatus | 'all',
  limit = 100,
): Promise<AdminProposalPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/proposals',
    query: {
      ...(status === 'all' ? {} : { status }),
      limit,
    },
    schema: adminProposalPageSchema,
  });
}

export interface ProposeActionInput {
  /** AdminAction value the proposal will gate. */
  readonly action: AdminAction;
  readonly reason: string;
  /** Optional structured payload, per-action. */
  readonly payload?: Record<string, unknown>;
}

export function raiseProposal(
  input: ProposeActionInput,
): Promise<z.infer<typeof proposedActionDtoSchema>> {
  return getAdminApiClient().post({
    path: '/api/v2/admin/proposals',
    body: proposeActionSchema.parse({
      action: input.action,
      reason: input.reason,
      ...(input.payload !== undefined ? { payload: input.payload } : {}),
    }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: proposedActionDtoSchema,
  });
}

export function approveProposal(
  proposalId: string,
  reason: string,
): Promise<z.infer<typeof proposedActionDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/proposals/${proposalId}/approve`,
    body: resolveProposalSchema.parse({ reason: reason === '' ? undefined : reason }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: proposedActionDtoSchema,
  });
}

export function rejectProposal(
  proposalId: string,
  reason: string,
): Promise<z.infer<typeof proposedActionDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/proposals/${proposalId}/reject`,
    body: resolveProposalSchema.parse({ reason: reason === '' ? undefined : reason }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: proposedActionDtoSchema,
  });
}

export function cancelProposal(
  proposalId: string,
): Promise<z.infer<typeof proposedActionDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/proposals/${proposalId}/cancel`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: proposedActionDtoSchema,
  });
}

/** Completes an approved ADMIN_PROVISION proposal by creating the platform admin. */
export function provisionAdminFromProposal(
  proposalId: string,
): Promise<z.infer<typeof platformAdminDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/proposals/${proposalId}/provision-admin`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: platformAdminDtoSchema,
  });
}

export function isProvisionAction(action: AdminAction): boolean {
  return action === AUTHORIZED_ACTION;
}

/* ─── Onboarding queue ─────────────────────────────────────────────────────── */

export function listOnboardingApplications(
  status: OnboardingStatus,
  limit = 100,
): Promise<OnboardingPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/onboarding/applications',
    query: { status, limit },
    schema: onboardingPageSchema,
  });
}

export function approveOnboardingApplication(
  applicationId: string,
  note?: string,
): Promise<z.infer<typeof approveOnboardingResultSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/onboarding/applications/${applicationId}/approve`,
    body: reviewOnboardingSchema.parse({
      note: note === undefined || note === '' ? undefined : note,
    }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: approveOnboardingResultSchema,
  });
}

export function rejectOnboardingApplication(
  applicationId: string,
  note?: string,
): Promise<z.infer<typeof onboardingRequestDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/onboarding/applications/${applicationId}/reject`,
    body: reviewOnboardingSchema.parse({
      note: note === undefined || note === '' ? undefined : note,
    }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: onboardingRequestDtoSchema,
  });
}

export function requestOnboardingChanges(
  applicationId: string,
  note?: string,
): Promise<z.infer<typeof onboardingRequestDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/onboarding/applications/${applicationId}/request-changes`,
    body: reviewOnboardingSchema.parse({
      note: note === undefined || note === '' ? undefined : note,
    }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: onboardingRequestDtoSchema,
  });
}

/* ─── Refunds ──────────────────────────────────────────────────────────────── */

export function listRefunds(
  status: AdminRefundRequestStatus | 'all',
  limit = 100,
): Promise<AdminRefundRequestPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/refunds',
    query: {
      ...(status === 'all' ? {} : { status }),
      limit,
    },
    schema: adminRefundRequestListResponseSchema,
  });
}

export function approveRefund(refundId: string): Promise<RefundOutcome> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/refunds/${refundId}/approve`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: refundOutcomeSchema,
  });
}

export function rejectRefund(refundId: string, reason: string): Promise<RefundOutcome> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/refunds/${refundId}/reject`,
    body: rejectRefundRequestSchema.parse({ reason }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: refundOutcomeSchema,
  });
}

export interface RequestRefundInput {
  readonly orderId: string;
  readonly amountPaise: number;
  readonly reason: string;
}

export function requestRefund(input: RequestRefundInput): Promise<RefundOutcome> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/refunds`,
    body: requestRefundSchema.parse(input),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: refundOutcomeSchema,
  });
}

export type { AdminRefundRequestStatus };

/* ─── Admins ───────────────────────────────────────────────────────────────── */

export function listAdmins(limit = 100): Promise<AdminPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/admins',
    query: { limit },
    schema: adminPageSchema,
  });
}

export function revokeAdmin(adminId: string): Promise<z.infer<typeof platformAdminDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/admins/${adminId}/revoke`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: platformAdminDtoSchema,
  });
}

export type { AdminRole };

/* ─── Audit trail ──────────────────────────────────────────────────────────── */

export function listAudit(limit = 100, targetId?: string): Promise<AdminAuditPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/audit',
    query: {
      limit,
      ...(targetId === undefined || targetId === '' ? {} : { targetId }),
    },
    schema: adminAuditPageSchema,
  });
}

export const ADMIN_AUDIT_ACTIONS = [
  'ONBOARDING_APPROVE',
  'VENUE_SUSPEND',
  'VENUE_REINSTATE',
  'ORGANIZATION_SUSPEND',
  'ORGANIZATION_REINSTATE',
  'FINANCIAL_REFUND',
  'PAYOUT_BATCH_RUN',
  'DISPUTE_RESOLVE',
  'PAYOUT_FREEZE',
  'PAYOUT_RELEASE',
  'ADMIN_PROVISION',
  'COMMISSION_ADJUST',
] satisfies AdminAction[];

export const ADMIN_ROLES = ['super', 'admin', 'ops', 'finance', 'support'] satisfies AdminRole[];

export const PROPOSAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
] satisfies ProposalStatus[];

export const ONBOARDING_STATUSES = [
  'submitted',
  'changes_requested',
  'approved',
  'rejected',
] satisfies OnboardingStatus[];

export const REFUND_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'settled',
  'failed',
] satisfies AdminRefundRequestStatus[];

export function statusFilterOptions<T extends string>(
  labels: Record<T, string>,
  values: readonly T[],
): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

/* ─── Directory (venues / events / hosts / users) ─────────────────────────── */

export type AdminVenuePage = z.infer<typeof adminVenueListResponseSchema>;

export function listVenues(limit = 100): Promise<AdminVenuePage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/venues',
    query: { limit },
    schema: adminVenueListResponseSchema,
  });
}

/** Suspends a venue outright — VENUE_SUSPEND is a TIER2 command (no proposal). */
export function suspendVenue(venueId: string): Promise<z.infer<typeof adminVenueDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/venues/${venueId}/suspend`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: adminVenueDtoSchema,
  });
}

/** Reinstates a suspended venue — VENUE_REINSTATE is a TIER2 command (no proposal). */
export function reinstateVenue(venueId: string): Promise<z.infer<typeof adminVenueDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/venues/${venueId}/reinstate`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: adminVenueDtoSchema,
  });
}

export type AdminEventPage = z.infer<typeof adminEventListResponseSchema>;

export function listEvents(limit = 100): Promise<AdminEventPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/events',
    query: { limit },
    schema: adminEventListResponseSchema,
  });
}

export type AdminHostPage = z.infer<typeof adminHostListResponseSchema>;

export function listHosts(limit = 100): Promise<AdminHostPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/hosts',
    query: { limit },
    schema: adminHostListResponseSchema,
  });
}

/**
 * Suspend/reinstate an organization — host/venue/promoter are capabilities
 * on an org's members in v2, not separate entity types, so this single pair
 * of TIER2 commands covers what v1 called host-suspend/promoter-suspend.
 */
export function suspendOrganization(
  organizationId: string,
): Promise<z.infer<typeof adminHostDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/organizations/${organizationId}/suspend`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: adminHostDtoSchema,
  });
}

export function reinstateOrganization(
  organizationId: string,
): Promise<z.infer<typeof adminHostDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/organizations/${organizationId}/reinstate`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: adminHostDtoSchema,
  });
}

export type AdminUserPage = z.infer<typeof adminUserListResponseSchema>;

export function listUsers(limit = 100): Promise<AdminUserPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/users',
    query: { limit },
    schema: adminUserListResponseSchema,
  });
}

/* ─── Payouts (administrative control desk) ───────────────────────────────── */

export type AdminPayoutPage = z.infer<typeof payoutListResponseSchema>;

export function listPayouts(
  status: AdminPayoutStatus | 'all' = 'all',
  limit = 100,
): Promise<AdminPayoutPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/payouts',
    query: {
      ...(status === 'all' ? {} : { status }),
      limit,
    },
    schema: payoutListResponseSchema,
  });
}

/**
 * Freeze/release are TIER3 (dual control) — they execute from an approved
 * PAYOUT_FREEZE / PAYOUT_RELEASE proposal. The desk raises the proposal, a
 * second admin approves it, then calls execute on the approved proposal.
 */
export function freezePayoutFromProposal(
  proposalId: string,
): Promise<z.infer<typeof payoutResponseSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/proposals/${proposalId}/freeze-payout`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: payoutResponseSchema,
  });
}

export function releasePayoutFromProposal(
  proposalId: string,
): Promise<z.infer<typeof payoutResponseSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/proposals/${proposalId}/release-payout`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: payoutResponseSchema,
  });
}

export function isPayoutProposalAction(action: AdminAction): boolean {
  return action === 'PAYOUT_FREEZE' || action === 'PAYOUT_RELEASE';
}

/**
 * Executes an approved freeze/release proposal — the second half of the
 * dual-control flow (first half: raise + approve on the Proposals desk).
 */
export function executePayoutProposal(
  proposal: z.infer<typeof proposedActionDtoSchema>,
): Promise<z.infer<typeof payoutResponseSchema>> {
  return proposal.action === 'PAYOUT_FREEZE'
    ? freezePayoutFromProposal(proposal.id)
    : releasePayoutFromProposal(proposal.id);
}

/** PAIR_BATCH_RUN is a TIER2 direct command — no proposal needed. */
export function runPayoutBatch(
  payoutIds: string[],
): Promise<z.infer<typeof payoutBatchResultSchema>> {
  return getAdminApiClient().post({
    path: '/api/v2/admin/payouts/batch-run',
    body: runPayoutBatchSchema.parse({ payoutIds }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: payoutBatchResultSchema,
  });
}

export const PAYOUT_STATUSES = [
  'requested',
  'processing',
  'paid',
  'failed',
  'frozen',
] satisfies AdminPayoutStatus[];

/* ─── Audit CSV export ─────────────────────────────────────────────────────── */

/**
 * Downloads the CSV export. The api-client's `fetchText` returns the raw body
 * so we can hand it to a blob without a JSON schema being involved.
 */
export async function exportAuditCsv(fileName = 'admin-audit.csv'): Promise<void> {
  const csv = await getAdminApiClient().fetchText({
    path: '/api/v2/admin/audit/export.csv',
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

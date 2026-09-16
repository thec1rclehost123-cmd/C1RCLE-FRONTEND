'use client';

/**
 * Typed repository over the gateway's `/api/v2/admin/*` surface, mirroring the
 * contract schemas from `@c1rcle/contracts` (whose generated files come from
 * the backend). Every mutation is idempotency-keyed so a retry after a network
 * blip replays the same command instead of double-executing.
 */
import { z } from 'zod';

import {
  adminAnalyticsSummaryDtoSchema,
  adminEventDtoSchema,
  adminEventListResponseSchema,
  adminHostDtoSchema,
  adminHostListResponseSchema,
  adminLookupResponseSchema,
  adminOrderDtoSchema,
  adminOrderListResponseSchema,
  adminRefundRequestDtoSchema,
  adminRefundRequestListResponseSchema,
  adminAuditRecordDtoSchema,
  adminUserDtoSchema,
  adminUserListResponseSchema,
  adminVenueDtoSchema,
  adminVenueListResponseSchema,
  approveOnboardingResultSchema,
  adminResolveDisputeSchema,
  disputeListResponseSchema,
  disputeResponseSchema,
  documentReadUrlDtoSchema,
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
  DisputeResolutionOutcome,
  DisputeStatus,
  OnboardingStatus,
  OrderStatus,
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

const ROLE_UPDATE_ACTION: AdminAction = 'ADMIN_ROLE_UPDATE';

/** Completes an approved ADMIN_ROLE_UPDATE proposal by applying the new role. */
export function updateAdminRoleFromProposal(
  proposalId: string,
): Promise<z.infer<typeof platformAdminDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/proposals/${proposalId}/update-admin-role`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: platformAdminDtoSchema,
  });
}

export function isRoleUpdateAction(action: AdminAction): boolean {
  return action === ROLE_UPDATE_ACTION;
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

/**
 * Mints a short-lived signed URL so an admin can actually view one uploaded
 * KYC image before deciding on the application. Any admin may call this —
 * viewing isn't itself a decision, so it isn't gated the way approve is.
 */
export function getOnboardingDocumentReadUrl(
  applicationId: string,
  label: string,
): Promise<z.infer<typeof documentReadUrlDtoSchema>> {
  return getAdminApiClient().get({
    path: `/api/v2/admin/onboarding/applications/${applicationId}/documents/${label}/read-url`,
    schema: documentReadUrlDtoSchema,
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

/* ─── Disputes ─────────────────────────────────────────────────────────────── */

export type AdminDisputePage = z.infer<typeof disputeListResponseSchema>;
export type AdminDispute = z.infer<typeof disputeResponseSchema>;

export function listDisputes(
  status: DisputeStatus | 'all',
  limit = 100,
): Promise<AdminDisputePage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/disputes',
    query: {
      ...(status === 'all' ? {} : { status }),
      limit,
    },
    schema: disputeListResponseSchema,
  });
}

export interface ResolveDisputeInput {
  readonly disputeId: string;
  readonly outcome: DisputeResolutionOutcome;
  readonly resolutionNote: string;
}

/** Resolves a dispute — TIER2, writes a correcting ledger entry when upheld. */
export function resolveDispute(input: ResolveDisputeInput): Promise<AdminDispute> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/disputes/${input.disputeId}/resolve`,
    body: adminResolveDisputeSchema.parse({
      outcome: input.outcome,
      resolutionNote: input.resolutionNote,
    }),
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: disputeResponseSchema,
  });
}

export const DISPUTE_STATUSES = ['open', 'under_review', 'resolved'] satisfies DisputeStatus[];

/* ─── Orders (platform-wide order list) ───────────────────────────────────── */

export type AdminOrderPage = z.infer<typeof adminOrderListResponseSchema>;
export type AdminOrder = z.infer<typeof adminOrderDtoSchema>;

export function listOrders(limit = 100): Promise<AdminOrderPage> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/orders',
    query: { limit },
    schema: adminOrderListResponseSchema,
  });
}

/** Order statuses, derived from the wire schema so the enum can never drift. */
export const ORDER_STATUSES: readonly OrderStatus[] = adminOrderDtoSchema.shape.status.options;

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
  'EVENT_PAUSE',
  'EVENT_RESUME',
  'ONBOARDING_APPROVE',
  'VENUE_SUSPEND',
  'VENUE_REINSTATE',
  'ORGANIZATION_SUSPEND',
  'ORGANIZATION_REINSTATE',
  'FINANCIAL_REFUND',
  'PAYOUT_BATCH_RUN',
  'DISPUTE_RESOLVE',
  'USER_BAN',
  'USER_UNBAN',
  'PAYOUT_FREEZE',
  'PAYOUT_RELEASE',
  'ADMIN_PROVISION',
  'ADMIN_ROLE_UPDATE',
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

/** Global entity lookup (the "omnibox") — parallel doc-id fetches, not a scan. */
export function globalLookup(query: string): Promise<z.infer<typeof adminLookupResponseSchema>> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/lookup',
    query: { q: query },
    schema: adminLookupResponseSchema,
  });
}

/** Platform-wide revenue/ticket/event summary. Bounded scan — see backend doc comment. */
export function getAnalyticsSummary(): Promise<z.infer<typeof adminAnalyticsSummaryDtoSchema>> {
  return getAdminApiClient().get({
    path: '/api/v2/admin/analytics',
    schema: adminAnalyticsSummaryDtoSchema,
  });
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

/**
 * Admin pause/resume override — EVENT_PAUSE/EVENT_RESUME are TIER1 (any
 * active admin, merely logged). `pauseEvent` sets `adminOverride: true`
 * so the partner UI can tell an admin halt apart from a self-pause.
 */
export function pauseEvent(eventId: string): Promise<z.infer<typeof adminEventDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/events/${eventId}/pause`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: adminEventDtoSchema,
  });
}

export function resumeEvent(eventId: string): Promise<z.infer<typeof adminEventDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/events/${eventId}/resume`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: adminEventDtoSchema,
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

/** Bans a user outright — USER_BAN is a TIER2 command (no proposal). */
export function banUser(
  userId: string,
  reason?: string,
): Promise<z.infer<typeof adminUserDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/users/${userId}/ban`,
    body: reason === undefined || reason === '' ? undefined : { reason },
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: adminUserDtoSchema,
  });
}

/** Reverses `banUser` — USER_UNBAN is a TIER2 command (no proposal). */
export function unbanUser(userId: string): Promise<z.infer<typeof adminUserDtoSchema>> {
  return getAdminApiClient().post({
    path: `/api/v2/admin/users/${userId}/unban`,
    headers: { 'idempotency-key': newIdempotencyKey() },
    schema: adminUserDtoSchema,
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
  downloadCsv(csv, fileName);
}

/**
 * User directory CSV export — email is redacted server-side for
 * non-super/non-finance admins, same rule v1 used.
 */
export async function exportUsersCsv(fileName = 'users.csv'): Promise<void> {
  const csv = await getAdminApiClient().fetchText({
    path: '/api/v2/admin/users/export.csv',
  });
  downloadCsv(csv, fileName);
}

function downloadCsv(csv: string, fileName: string): void {
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

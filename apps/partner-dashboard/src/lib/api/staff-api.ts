import {
  invitationDtoSchema,
  organizationDtoSchema,
  organizationMemberDtoSchema,
  paginatedSchema,
  type CreateInvitationRequest,
  type InvitationDto,
  type OrganizationDto,
  type OrganizationMemberDto,
  type Paginated,
  type PaginationQuery,
} from '@c1rcle/contracts/client';

import { getActiveOrgId } from '@/lib/org/active-org';

import { apiClient } from './client';

const memberListSchema = paginatedSchema(organizationMemberDtoSchema);
const invitationListSchema = paginatedSchema(invitationDtoSchema);

function getIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${String(Date.now())}-${Math.random().toString(36).slice(2, 11)}`;
}

function getOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  return getActiveOrgId();
}

function buildHeaders(includeIdempotency = false): Record<string, string> {
  // NOTE: 'content-type' is intentionally omitted (see partner-connections.ts).
  // The shared client adds it only when a body is present.
  const headers: Record<string, string> = {};
  const orgId = getOrgId();
  if (orgId) {
    headers['x-organization-id'] = orgId;
  }
  if (includeIdempotency) {
    headers['idempotency-key'] = getIdempotencyKey();
  }
  return headers;
}

export interface StaffApi {
  listMembers(organizationId: string, params?: PaginationQuery): Promise<Paginated<OrganizationMemberDto>>;
  listInvitations(organizationId: string, params?: PaginationQuery): Promise<Paginated<InvitationDto>>;
  createInvitation(organizationId: string, body: CreateInvitationRequest): Promise<InvitationDto>;
  revokeInvitation(invitationId: string): Promise<InvitationDto>;
  /**
   * Accepts an invitation as the signed-in invitee. Deliberately org-unscoped:
   * membership is what this grants, so no `x-organization-id` is sent — the
   * gateway resolves the actor from the session alone.
   */
  acceptInvitation(invitationId: string): Promise<OrganizationDto>;
  /**
   * The caller's own pending invitations, across orgs. Same org-unscoped
   * session-only shape as accept — this is what lets a fresh login with zero
   * orgs discover its invite instead of landing on onboarding with nowhere
   * to go.
   */
  listMyInvitations(): Promise<Paginated<InvitationDto>>;
}

/**
 * Staff (organization members + email invitations) API.
 *
 * Backend truth: `apps/api-gateway/src/routes/v2/partner/organizations.ts`.
 * - `GET /organizations/:id/members` requires `organization.read`.
 * - `GET/POST /organizations/:id/invitations` and `POST /invitations/:id/revoke`
 *   require `staff.manage` (backend `MANAGE_STAFF`).
 * - Writes require `Idempotency-Key`; every org-scoped request requires
 *   `x-organization-id` matching the path org.
 * - `POST /organizations/:id/members` (direct userId add) is intentionally not
 *   exposed here — the dashboard uses the email-invitation flow.
 */
export const staffApi: StaffApi = {
  listMembers: (organizationId, params) =>
    apiClient.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/members`,
      query: {
        limit: params?.limit ?? 50,
        ...(params?.cursor ? { cursor: params.cursor } : {}),
      },
      headers: buildHeaders(false),
      schema: memberListSchema,
    }),

  listInvitations: (organizationId, params) =>
    apiClient.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/invitations`,
      query: {
        limit: params?.limit ?? 50,
        ...(params?.cursor ? { cursor: params.cursor } : {}),
      },
      headers: buildHeaders(false),
      schema: invitationListSchema,
    }),

  createInvitation: (organizationId, body) =>
    apiClient.post({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/invitations`,
      body,
      headers: buildHeaders(true),
      schema: invitationDtoSchema,
    }),

  revokeInvitation: (invitationId) =>
    apiClient.post({
      path: `/api/v2/invitations/${encodeURIComponent(invitationId)}/revoke`,
      headers: buildHeaders(true),
      schema: invitationDtoSchema,
    }),

  acceptInvitation: (invitationId) =>
    apiClient.post({
      path: `/api/v2/invitations/${encodeURIComponent(invitationId)}/accept`,
      headers: {},
      schema: organizationDtoSchema,
    }),

  listMyInvitations: () =>
    apiClient.get({
      path: '/api/v2/auth/invitations/mine',
      headers: {},
      schema: invitationListSchema,
    }),
};

export type { CreateInvitationRequest, InvitationDto, OrganizationDto, OrganizationMemberDto };

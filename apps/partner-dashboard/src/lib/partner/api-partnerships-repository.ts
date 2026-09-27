import { paginatedSchema, partnershipDtoSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import type { PartnershipDto } from '@c1rcle/contracts';

/**
 * ─── Partnerships (venue ↔ host) ───────────────────────────────────────────
 *
 * The venue-side half of the partnership graph. Every route here is
 * org-scoped server-side and `validateV2` is strict about `X-Organization-Id`
 * matching the `:organizationId` path segment (see
 * `apps/api-gateway/src/routes/v2/partner/partnerships.ts` — `readHeaders` /
 * `commandHeaders`), so the header is sent on every call including the
 * partnership-level commands, whose paths carry only `:partnershipId`.
 *
 * `Idempotency-Key` is "one per user intent, not per retry". Every mutation
 * here takes an optional `idempotencyKey` so a caller that retries the *same*
 * intent (a double-click, a network retry) can replay the same key and get the
 * original response back instead of negotiating the rate twice. Callers that
 * don't care get a fresh key per call, which is correct for a deliberate
 * re-negotiation.
 */

/** Actions the counterparty/either side may take. Kept in sync with the route. */
export type PartnershipAction = 'approve' | 'reject' | 'block' | 'end';

function orgHeaders(organizationId: string): Record<string, string> {
  return { 'X-Organization-Id': organizationId };
}

function commandHeaders(
  organizationId: string,
  idempotencyKey?: string,
): Record<string, string> {
  return {
    ...orgHeaders(organizationId),
    'Idempotency-Key': idempotencyKey ?? crypto.randomUUID(),
  };
}

/**
 * Every partnership the organization is a party to, in either direction. The
 * backend pages this; one page is the whole list for any realistic tenant, and
 * the screen only ever renders the first page.
 */
export async function listPartnerships(organizationId: string): Promise<PartnershipDto[]> {
  const response = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partnerships`,
    headers: orgHeaders(organizationId),
    schema: paginatedSchema(partnershipDtoSchema),
  });
  return response.items;
}

/**
 * Opens a partnership request. `initiatedBy` says which side the CALLER is —
 * the backend derives the counterparty organization from the venue, so a
 * client cannot address a request at an organization that does not own it.
 */
export async function requestPartnership(
  organizationId: string,
  input: {
    readonly venueId: string;
    readonly initiatedBy: 'host' | 'venue';
    readonly message?: string;
    /** Optional opening proposal, whole-number percent 0–50. */
    readonly venueShareRate?: number;
  },
  idempotencyKey?: string,
): Promise<PartnershipDto> {
  return apiClient.post({
    path: '/api/v2/partnerships',
    body: input,
    schema: partnershipDtoSchema,
    headers: commandHeaders(organizationId, idempotencyKey),
  });
}

/**
 * `approve`/`reject` are the counterparty's answer; `block`/`end` are open to
 * either side. Which is which is a domain rule, not a UI one — the backend
 * rejects an illegal combination, so the screen only needs to offer the verbs
 * that make sense for the current actor and status.
 */
export async function resolvePartnership(
  organizationId: string,
  partnershipId: string,
  action: PartnershipAction,
  options: { readonly reason?: string; readonly idempotencyKey?: string } = {},
): Promise<PartnershipDto> {
  return apiClient.post({
    path: `/api/v2/partnerships/${encodeURIComponent(partnershipId)}/${action}`,
    body: options.reason ? { reason: options.reason } : {},
    schema: partnershipDtoSchema,
    headers: commandHeaders(organizationId, options.idempotencyKey),
  });
}

/**
 * Negotiates (or clears) the venue's share of each settlement's gross.
 *
 * `venueShareRate` is a whole-number percent, NOT a 0..1 ratio — v1's
 * `venueCommissionRate` convention. `null` clears the negotiated rate, which
 * puts settlement back on its documented fail-safe (the whole non-platform-fee
 * gross goes to the host) rather than freezing a stale number in place.
 *
 * Only a party to an `active` partnership may set it; the domain enforces the
 * 0–50 bounds and bumps the aggregate version, so the UI does not need to
 * second-guess a 422 — but it should not offer the control where the domain
 * would refuse it.
 */
export async function setVenueShare(
  organizationId: string,
  partnershipId: string,
  venueShareRate: number | null,
  idempotencyKey?: string,
): Promise<PartnershipDto> {
  return apiClient.post({
    path: `/api/v2/partnerships/${encodeURIComponent(partnershipId)}/venue-share`,
    body: { venueShareRate },
    schema: partnershipDtoSchema,
    headers: commandHeaders(organizationId, idempotencyKey),
  });
}

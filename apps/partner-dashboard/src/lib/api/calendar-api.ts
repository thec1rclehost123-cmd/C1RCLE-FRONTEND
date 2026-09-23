/**
 * calendar-api.ts
 *
 * Thin client for the venue calendar endpoints on the v2 API gateway.
 *
 * Endpoints covered:
 *   POST   /api/v2/venues/:venueId/calendar/blocks            — create a blocked slot
 *   DELETE /api/v2/venues/:venueId/calendar/blocks/:blockId   — unblock (soft-cancel)
 *   GET    /api/v2/venues/:venueId/calendar                   — list slots for a window
 *
 * All routes require:
 *   - Bearer token (handled by `apiClient`)
 *   - `x-organization-id` header (the active org's ID)
 *   - `idempotency-key` header for mutations (to make them safe to retry)
 */

import { z } from 'zod';

import { venueSlotDtoSchema } from '@c1rcle/contracts/client';

import { getActiveOrgId } from '@/lib/org/active-org';

import { apiClient } from './client';

import type { VenueSlotDto } from '@c1rcle/contracts/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  return getActiveOrgId();
}

function buildHeaders(includeIdempotency: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  const orgId = getOrgId();
  if (orgId) headers['x-organization-id'] = orgId;
  if (includeIdempotency) {
    // Stable enough for this use-case: a fresh key per submit attempt.
    headers['idempotency-key'] = `${String(Date.now())}-${Math.random().toString(36).slice(2, 11)}`;
  }
  return headers;
}

const venueSlotListSchema = z.array(venueSlotDtoSchema);

// ── Public API ────────────────────────────────────────────────────────────────

export interface BlockVenueDateInput {
  /** Human-readable label for the block (e.g. "Private event", "Maintenance"). */
  readonly label: string;
  /** ISO 8601 datetime — the start of the blocked window. */
  readonly startTime: string;
  /** ISO 8601 datetime — the end of the blocked window. Must be after startTime. */
  readonly endTime: string;
}

/**
 * Creates a blocked slot for the given venue.
 *
 * Maps to: POST /api/v2/venues/:venueId/calendar/blocks
 * Permission: venue.manage
 */
export async function blockVenueDate(
  venueId: string,
  input: BlockVenueDateInput,
): Promise<VenueSlotDto> {
  return apiClient.post({
    path: `/api/v2/venues/${encodeURIComponent(venueId)}/calendar/blocks`,
    body: input,
    headers: buildHeaders(true),
    schema: venueSlotDtoSchema,
  });
}

/**
 * Removes a blocked slot for the given venue (soft-cancel on the backend).
 *
 * Maps to: DELETE /api/v2/venues/:venueId/calendar/blocks/:blockId
 * Permission: venue.manage
 */
export async function unblockVenueDate(
  venueId: string,
  blockId: string,
): Promise<VenueSlotDto> {
  return apiClient.delete({
    path: `/api/v2/venues/${encodeURIComponent(venueId)}/calendar/blocks/${encodeURIComponent(blockId)}`,
    headers: buildHeaders(true),
    schema: venueSlotDtoSchema,
  });
}

/**
 * Lists all calendar slots for the given venue within a time window.
 *
 * Maps to: GET /api/v2/venues/:venueId/calendar?from=...&to=...
 * Permission: venue.read
 */
export async function getVenueCalendarSlots(
  venueId: string,
  from: string,
  to: string,
): Promise<VenueSlotDto[]> {
  return apiClient.get({
    path: `/api/v2/venues/${encodeURIComponent(venueId)}/calendar`,
    query: { from, to },
    headers: buildHeaders(false),
    schema: venueSlotListSchema,
  });
}

export type { VenueSlotDto };

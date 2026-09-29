import { paginatedSchema, venueDtoSchema, venueProfileDtoSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import type { VenueDto, VenueProfileDto } from '@c1rcle/contracts';

/**
 * Venue routes are org-scoped server-side and require `X-Organization-Id`
 * on every call (`venueHeaders`/`updateVenueHeaders` in
 * `apps/api-gateway/src/routes/v2/partner/venues.ts` are `.strict()`
 * about it) — unlike `org-repository.ts`'s calls, which don't need it
 * because the actor's own membership already scopes them. No other
 * repository in this app has called a venue route yet (the venue-settings
 * screen was a documented, fully mocked stub before this), so this is the
 * first place that header actually gets sent from partner-dashboard.
 */
function orgHeaders(organizationId: string): Record<string, string> {
  return { 'X-Organization-Id': organizationId };
}

/**
 * A partner org has exactly one venue in this product's current shape (every
 * `/venue/*` route is un-parameterized — no `[venueId]` segment anywhere
 * under `app/venue/`), so "the org's venue" means the first page of one.
 * Returns `null` rather than throwing when an org has no venue yet, since
 * that's a real, valid state (a brand-new org before venue creation).
 */
export async function getMyVenue(organizationId: string): Promise<VenueDto | null> {
  const response = await apiClient.get({
    path: `/api/v2/organizations/${organizationId}/venues`,
    headers: orgHeaders(organizationId),
    schema: paginatedSchema(venueDtoSchema),
  });
  return response.items[0] ?? null;
}

export async function getVenueProfile(
  venueId: string,
  organizationId: string,
): Promise<VenueProfileDto> {
  return apiClient.get({
    path: `/api/v2/venues/${venueId}/profile`,
    headers: orgHeaders(organizationId),
    schema: venueProfileDtoSchema,
  });
}

export interface UpdateVenueProfileInput {
  readonly public?: Partial<VenueProfileDto['public']>;
  readonly private?: Partial<VenueProfileDto['private']>;
}

/**
 * `expectedVersion` comes from the venue's own `VenueDto.version`
 * (`getMyVenue`), NOT from `VenueProfileDto` — the profile response has no
 * version field of its own; `PATCH .../profile` still optimistic-locks
 * against the underlying venue's version via `If-Match`.
 *
 * IMPORTANT — the backend does a SHALLOW merge on `public` (and therefore
 * on `public.address` as a whole key): sending `{ address: { lat, lng } }`
 * alone REPLACES the entire address, dropping street/city/etc. Callers
 * editing only part of the address must spread the current address first.
 */
export async function updateVenueProfile(
  venueId: string,
  organizationId: string,
  expectedVersion: number,
  update: UpdateVenueProfileInput,
): Promise<VenueProfileDto> {
  return apiClient.patch({
    path: `/api/v2/venues/${venueId}/profile`,
    body: update,
    schema: venueProfileDtoSchema,
    headers: {
      ...orgHeaders(organizationId),
      'If-Match': String(expectedVersion),
      'Idempotency-Key': crypto.randomUUID(),
    },
  });
}

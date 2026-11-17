import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { venueEventDetailResponseSchema, type VenueEventDetailResponse } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export interface VenueEventDetailViewModel extends VenueEventDetailResponse {
  readonly hostName: string | null;
  readonly venueName: string | null;
}

export async function loadVenueEventDetail(eventId: string) {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');

  const client = createServerApiClient(cookieHeader);
  const record = await client.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/venue-events/${encodeURIComponent(eventId)}`,
    schema: venueEventDetailResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });

  return {
    ...record,
    hostName: record.event.hostName,
    venueName: record.event.venueName,
  } satisfies VenueEventDetailViewModel;
}

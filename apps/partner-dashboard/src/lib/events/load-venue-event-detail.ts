import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { venueEventDetailResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export async function loadVenueEventDetail(eventId: string) {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');

  return createServerApiClient(cookieHeader).get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/venue-events/${encodeURIComponent(eventId)}`,
    schema: venueEventDetailResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });
}

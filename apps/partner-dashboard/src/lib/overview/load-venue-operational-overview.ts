import 'server-only';

import { cookies } from 'next/headers';

import { venueOperationalOverviewDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';

export async function loadVenueOperationalOverview(organizationId: string) {
  const cookieHeader = (await cookies()).toString();
  return createServerApiClient(cookieHeader).get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/venue-overview`,
    schema: venueOperationalOverviewDtoSchema,
    headers: { 'x-organization-id': organizationId },
  });
}

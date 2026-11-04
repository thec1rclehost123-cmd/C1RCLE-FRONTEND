import 'server-only';

import { cookies } from 'next/headers';

import { eventCoverPolicyHistoryDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export async function loadPartnerEventCoverPolicy(eventId: string) {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before reviewing cover policy.');
  const client = createServerApiClient(cookieHeader);
  const history = await client.get({
    path: `/api/v2/events/${encodeURIComponent(eventId)}/cover-policy`,
    schema: eventCoverPolicyHistoryDtoSchema,
    headers: { 'x-organization-id': organizationId },
  });
  return { organizationId, history };
}

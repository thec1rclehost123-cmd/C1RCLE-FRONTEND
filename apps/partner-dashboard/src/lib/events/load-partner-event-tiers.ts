import 'server-only';

import { cookies } from 'next/headers';

import { ticketTierDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export async function loadPartnerEventTiers(eventId: string) {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before editing ticket limits.');
  const tiers = await createServerApiClient(cookieHeader).get({
    path: `/api/v2/events/${encodeURIComponent(eventId)}/ticket-tiers`,
    schema: ticketTierDtoSchema.array(),
    headers: { 'x-organization-id': organizationId },
  });
  return tiers;
}

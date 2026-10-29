import 'server-only';

import { cookies } from 'next/headers';

import { ticketTierDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export async function loadPartnerEventWaitlist(eventId: string) {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before managing a waitlist.');
  const client = createServerApiClient(cookieHeader);
  const tiers = await client.get({
    path: `/api/v2/events/${encodeURIComponent(eventId)}/ticket-tiers`,
    schema: ticketTierDtoSchema.array(),
    headers: { 'x-organization-id': organizationId },
  });
  return {
    organizationId,
    tiers: tiers.filter((tier) => tier.status === 'active' && tier.accessType !== 'RSVP'),
  };
}

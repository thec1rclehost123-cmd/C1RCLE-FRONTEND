import 'server-only';

import { cookies } from 'next/headers';

import { paginatedSchema, ticketAccessCodeDtoSchema, ticketTierDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export async function loadPartnerEventAccess(eventId: string) {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before managing event access.');
  const client = createServerApiClient(cookieHeader);
  const headers = { 'x-organization-id': organizationId };
  const [tiers, codes] = await Promise.all([
    client.get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/ticket-tiers`,
      schema: ticketTierDtoSchema.array(),
      headers,
    }),
    client.get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/access-codes?limit=100`,
      schema: paginatedSchema(ticketAccessCodeDtoSchema),
      headers,
    }),
  ]);
  return {
    organizationId,
    tiers: tiers.filter((tier) => tier.accessMode === 'code' || tier.accessMode === 'invited'),
    codes: codes.items,
  };
}

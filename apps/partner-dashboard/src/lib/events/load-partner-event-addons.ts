import 'server-only';

import { cookies } from 'next/headers';

import { ticketAddonListResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export async function loadPartnerEventAddons(eventId: string) {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before managing event extras.');
  const client = createServerApiClient(cookieHeader);
  const catalog = await client.get({
    path: `/api/v2/events/${encodeURIComponent(eventId)}/ticket-addons`,
    schema: ticketAddonListResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });
  return { organizationId, addons: catalog.items };
}

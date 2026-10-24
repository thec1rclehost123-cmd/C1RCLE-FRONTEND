import 'server-only';

import { cookies } from 'next/headers';

import { doorGuestListResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { DoorGuest } from '@c1rcle/contracts';

export async function loadPartnerEventGuests(eventId: string): Promise<readonly DoorGuest[]> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before viewing event guests.');
  const response = await createServerApiClient(cookieHeader).get({
    path: `/api/v2/door/guests?eventId=${encodeURIComponent(eventId)}&limit=1000`,
    schema: doorGuestListResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });
  return response.items;
}

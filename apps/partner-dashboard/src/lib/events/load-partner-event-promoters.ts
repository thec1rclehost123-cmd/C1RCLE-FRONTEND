import 'server-only';

import { cookies } from 'next/headers';

import { paginatedSchema } from '@c1rcle/api-client';
import { referralLinkDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { ReferralLinkDto } from '@c1rcle/contracts';

export async function loadPartnerEventPromoters(
  eventId: string,
): Promise<readonly ReferralLinkDto[]> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before viewing promoter metrics.');

  const response = await createServerApiClient(cookieHeader).get({
    path: `/api/v2/events/${encodeURIComponent(eventId)}/referral-links?limit=100`,
    schema: paginatedSchema(referralLinkDtoSchema),
    headers: { 'x-organization-id': organizationId },
  });
  return response.items;
}

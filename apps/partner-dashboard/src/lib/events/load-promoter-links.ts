import 'server-only';

import { cookies } from 'next/headers';

import { promoterReferralLinkListResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export async function loadPromoterLinks(cursor: string | null = null) {
  if (cursor !== null && (!/^\d+$/u.test(cursor) || !Number.isSafeInteger(Number(cursor)))) {
    throw new Error('Invalid referral-link page cursor.');
  }
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select a Promoter organization before viewing links.');
  const client = createServerApiClient(cookieHeader);
  const links = await client.get({
    path: `/api/v2/promoters/${encodeURIComponent(organizationId)}/referral-links?limit=100${cursor === null ? '' : `&cursor=${encodeURIComponent(cursor)}`}`,
    schema: promoterReferralLinkListResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });
  return links;
}

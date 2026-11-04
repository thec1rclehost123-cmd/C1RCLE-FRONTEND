import 'server-only';

import { cookies } from 'next/headers';

import { promoterCampaignSummaryDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { ServerApiClient } from '@/lib/api/server-client';
import type { PromoterCampaignSummaryDto } from '@c1rcle/contracts';

export async function loadPromoterCampaignSummary(
  options: {
    readonly client?: ServerApiClient;
    readonly organizationId?: string | null;
  } = {},
): Promise<PromoterCampaignSummaryDto> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = options.organizationId ?? getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select a Promoter organization before viewing analytics.');
  const client = options.client ?? createServerApiClient(cookieHeader);
  return client.get({
    path: `/api/v2/promoters/${encodeURIComponent(organizationId)}/campaign-summary`,
    schema: promoterCampaignSummaryDtoSchema,
    headers: { 'x-organization-id': organizationId },
  });
}

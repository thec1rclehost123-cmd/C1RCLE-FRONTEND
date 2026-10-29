import 'server-only';

import { cookies } from 'next/headers';

import { promoterAttributedOrderListResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getFinanceBalance, listLedgerEntries } from '@/lib/finance/api-finance-repository';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import { loadPromoterCampaignSummary } from './load-promoter-campaign-summary';
import { loadPromoterEvents } from './load-promoter-events';

export async function loadPromoterOverview() {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId)
    throw new Error('Select a Promoter organization before viewing performance.');
  const client = createServerApiClient(cookieHeader);
  const [events, balance, ledger, campaignSummary, attributedOrders] = await Promise.all([
    loadPromoterEvents({ client, organizationId }),
    getFinanceBalance(client, organizationId),
    listLedgerEntries(client, organizationId, { limit: 100 }),
    loadPromoterCampaignSummary({ client, organizationId }),
    client.get({
      path: `/api/v2/promoters/${encodeURIComponent(organizationId)}/attributed-orders?limit=100`,
      schema: promoterAttributedOrderListResponseSchema,
      headers: { 'x-organization-id': organizationId },
    }),
  ]);
  return { events, balance, ledger, campaignSummary, attributedOrders };
}

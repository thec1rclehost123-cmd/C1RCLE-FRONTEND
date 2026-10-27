import 'server-only';

import { cookies } from 'next/headers';

import { createServerApiClient } from '@/lib/api/server-client';
import { getFinanceBalance } from '@/lib/finance/api-finance-repository';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';
import {
  getOrganizationOverview,
  getOrganizationSalesBreakdown,
  getOrganizationTrends,
} from '@/lib/overview/api-overview-repository';
import { dayKeyOffset } from '@/lib/overview/overview-view-model';

import type {
  BalanceSummaryResponse,
  OrganizationOverviewDto,
  OrganizationSalesBreakdownDto,
  OrganizationTrendsDto,
} from '@c1rcle/contracts';

export interface PartnerOrganizationAnalytics {
  readonly overview: OrganizationOverviewDto;
  readonly salesBreakdown: OrganizationSalesBreakdownDto;
  readonly partnerPayable: BalanceSummaryResponse;
  readonly lastThirtyDays: OrganizationTrendsDto;
}

export async function loadPartnerOrganizationAnalytics(): Promise<PartnerOrganizationAnalytics> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before viewing analytics.');

  const client = createServerApiClient(cookieHeader);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const [overview, salesBreakdown, partnerPayable, lastThirtyDays] = await Promise.all([
    getOrganizationOverview(client, organizationId),
    getOrganizationSalesBreakdown(client, organizationId),
    getFinanceBalance(client, organizationId),
    getOrganizationTrends(client, organizationId, {
      from: dayKeyOffset(now, 29),
      to: today,
      granularity: 'day',
    }),
  ]);
  return { overview, salesBreakdown, partnerPayable, lastThirtyDays };
}

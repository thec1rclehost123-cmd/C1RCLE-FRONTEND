import 'server-only';

import { cookies } from 'next/headers';

import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';
import {
  getOrganizationOverview,
  getOrganizationSalesBreakdown,
  getOrganizationTrends,
} from '@/lib/overview/api-overview-repository';

import type {
  BalanceSummaryResponse,
  OrganizationOverviewDto,
  OrganizationSalesBreakdownDto,
  OrganizationTrendsDto,
} from '@c1rcle/contracts';

export type PartnerAnalyticsRange = '7d' | '30d' | '90d' | '12m' | 'all';
export type PartnerAnalyticsBreakdown = 'day' | 'month';

const RANGE_DAYS: Record<Exclude<PartnerAnalyticsRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
};

function istDayKey(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PRODUCT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function offsetDayKey(dayKey: string, offset: number): string {
  const [year = '0', month = '1', day = '1'] = dayKey.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + offset));
  return date.toISOString().slice(0, 10);
}

function firstDayOfMonthOffset(dayKey: string, months: number): string {
  const [year = '0', month = '1'] = dayKey.split('-');
  return new Date(Date.UTC(Number(year), Number(month) - 1 + months, 1)).toISOString().slice(0, 10);
}

export interface PartnerOrganizationAnalytics {
  readonly overview: OrganizationOverviewDto;
  readonly salesBreakdown: OrganizationSalesBreakdownDto;
  readonly partnerPayable?: BalanceSummaryResponse;
  readonly lastThirtyDays: OrganizationTrendsDto;
}

export async function loadPartnerOrganizationAnalytics(
  options: {
    readonly range?: PartnerAnalyticsRange;
    readonly breakdown?: PartnerAnalyticsBreakdown;
  } = {},
): Promise<PartnerOrganizationAnalytics> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before viewing analytics.');

  const client = createServerApiClient(cookieHeader);
  const range = options.range ?? 'all';
  const breakdown = options.breakdown ?? 'month';
  const today = istDayKey(new Date());
  const firstDay =
    range === 'all'
      ? breakdown === 'month'
        ? firstDayOfMonthOffset(today, -11)
        : offsetDayKey(today, -89)
      : range === '12m' && breakdown === 'month'
        ? firstDayOfMonthOffset(today, -11)
        : offsetDayKey(today, -(RANGE_DAYS[range] - 1));
  const granularity = breakdown;
  const [overview, salesBreakdown, lastThirtyDays] = await Promise.all([
    getOrganizationOverview(client, organizationId),
    getOrganizationSalesBreakdown(client, organizationId),
    getOrganizationTrends(client, organizationId, {
      from: firstDay,
      to: today,
      granularity,
    }),
  ]);
  return { overview, salesBreakdown, lastThirtyDays };
}

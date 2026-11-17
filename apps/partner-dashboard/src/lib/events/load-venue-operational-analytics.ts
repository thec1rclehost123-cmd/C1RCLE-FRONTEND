import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PRODUCT_TIME_ZONE, venueOperationalAnalyticsDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { PartnerAnalyticsRange } from './load-partner-organization-analytics';

const rangeDays: Record<PartnerAnalyticsRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
  all: 365,
};

function productDayKey(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PRODUCT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function offsetDay(dayKey: string, offset: number): string {
  const [year = '0', month = '1', day = '1'] = dayKey.split('-');
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + offset))
    .toISOString()
    .slice(0, 10);
}

export async function loadVenueOperationalAnalytics(range: PartnerAnalyticsRange) {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');
  const to = productDayKey(new Date());
  const from = offsetDay(to, -(rangeDays[range] - 1));
  const query = new URLSearchParams({ from, to });
  return createServerApiClient(cookieHeader).get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/venue-analytics?${query.toString()}`,
    schema: venueOperationalAnalyticsDtoSchema,
    headers: { 'x-organization-id': organizationId },
  });
}

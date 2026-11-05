import type { OrganizationTrendsDto, TrendBucketDto } from '@c1rcle/contracts';

const counters = [
  'revenuePaise',
  'tickets',
  'checkIns',
  'totalTicketsIssued',
  'paidTickets',
  'freeRsvpTickets',
  'paidOrderCount',
  'guestGrossCollectedPaise',
  'ticketRevenuePaise',
] as const;
/** Group an already bounded daily cohort. Never expand a trailing period to whole months. */
export function monthlyAnalyticsView(daily: OrganizationTrendsDto): OrganizationTrendsDto {
  const months = new Map<string, TrendBucketDto>();
  for (const bucket of daily.buckets) {
    const key = bucket.key.slice(0, 7);
    const current = months.get(key);
    if (!current) months.set(key, { ...bucket, key });
    else for (const counter of counters) current[counter] += bucket[counter];
  }
  return { ...daily, granularity: 'month', buckets: [...months.values()] };
}

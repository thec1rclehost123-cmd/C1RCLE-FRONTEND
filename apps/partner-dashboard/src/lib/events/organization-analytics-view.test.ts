import { expect, it } from 'vitest';

import { monthlyAnalyticsView } from './organization-analytics-view';

import type { OrganizationTrendsDto, TrendBucketDto } from '@c1rcle/contracts';

const bucket = (key: string, value: number): TrendBucketDto => ({
  key,
  revenuePaise: value,
  tickets: value,
  checkIns: 0,
  totalTicketsIssued: value,
  paidTickets: value,
  freeRsvpTickets: 0,
  paidOrderCount: value,
  guestGrossCollectedPaise: value,
  ticketRevenuePaise: value,
});
it('groups only days in the requested cohort, preserving exact totals, bounds and source records', () => {
  const buckets = [bucket('2026-10-23', 2), bucket('2026-10-31', 3), bucket('2026-11-01', 4)];
  const source: OrganizationTrendsDto = {
    organizationId: 'org-a',
    from: '2026-10-23',
    to: '2026-11-21',
    granularity: 'day',
    buckets,
    totals: {
      revenuePaise: 9,
      tickets: 9,
      checkIns: 0,
      totalTicketsIssued: 9,
      paidTickets: 9,
      freeRsvpTickets: 0,
      paidOrderCount: 9,
      guestGrossCollectedPaise: 9,
      ticketRevenuePaise: 9,
    },
  };
  const result = monthlyAnalyticsView(source);
  expect(result.buckets.map((row) => [row.key, row.totalTicketsIssued])).toEqual([
    ['2026-10', 5],
    ['2026-11', 4],
  ]);
  expect(result.from).toBe('2026-10-23');
  expect(result.to).toBe('2026-11-21');
  expect(result.totals).toEqual(source.totals);
  expect(source.buckets[0]?.key).toBe('2026-10-23');
  expect(source.buckets[0]?.totalTicketsIssued).toBe(2);
});

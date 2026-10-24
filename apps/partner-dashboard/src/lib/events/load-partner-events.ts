import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { organizationEventListResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { PartnerEventsData, PartnerEventRecord } from '@/data/partner-data-source';

const PAGE_SIZE = 50;

export async function loadPartnerEvents(input: {
  studio: 'host' | 'venue';
  cursor?: string | undefined;
}): Promise<PartnerEventsData> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');
  const search = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (input.cursor) search.set('cursor', input.cursor);
  const response = await createServerApiClient(cookieHeader).get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/events?${search.toString()}`,
    schema: organizationEventListResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });
  const events = response.items.map((item) => mapEvent(item, input.studio));
  return {
    dataStatus: 'api',
    pendingRequestCount: null,
    total: response.pageInfo.total,
    nextCursor: response.pageInfo.nextCursor,
    events,
  };
}

function mapEvent(
  item: ReturnType<typeof organizationEventListResponseSchema.parse>['items'][number],
  studio: 'host' | 'venue',
): PartnerEventRecord {
  const date = new Date(item.startAt);
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const status = mapStatus(item.status, date);
  const artwork = item.imageUrl
    ? { type: 'image' as const, value: item.imageUrl, alt: item.title }
    : { type: 'gradient' as const, value: 'placeholder' };
  const priceLabel = item.isFree
    ? 'Free'
    : item.startingPricePaise === null
      ? 'Price not set'
      : new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2,
        }).format(item.startingPricePaise / 100);

  return {
    id: item.id,
    name: item.title,
    tag: item.tags[0] ?? 'Event',
    status,
    party: studio === 'host' ? 'hosts' : 'venue',
    venue: item.venueName ?? 'Venue not specified',
    host: 'Host details unavailable',
    hostInitials: '—',
    dateLabel: formatter.format(date),
    timeLabel: `${value('hour')}:${value('minute')} ${value('dayPeriod')}`,
    dayLabel: value('day'),
    monthLabel: value('month').toUpperCase(),
    priceLabel,
    sold: item.ticketsSold,
    capacity: item.capacity,
    salesCountComplete: item.salesCountComplete,
    revenueLabel: 'Revenue unavailable in this view',
    artwork,
  };
}

function mapStatus(status: string, startAt: Date): PartnerEventRecord['status'] {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'review':
      return 'Review';
    case 'scheduled':
      return 'Scheduled';
    case 'published':
    case 'started':
      return 'Live';
    case 'sales_paused':
      return 'Paused';
    case 'ended':
      return 'Past';
    case 'archived':
      return 'Archived';
    case 'cancelled':
      return 'Cancelled';
    default:
      return startAt.getTime() < Date.now() ? 'Past' : 'Draft';
  }
}

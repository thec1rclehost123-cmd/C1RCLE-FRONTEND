import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  PRODUCT_TIME_ZONE,
  organizationEventListResponseSchema,
  venueOperationalEventListResponseSchema,
} from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { PartnerEventsData, PartnerEventRecord } from '@/data/partner-data-source';
import type { VenueOperationalEventDto } from '@c1rcle/contracts';

const PAGE_SIZE = 100;
const MAX_OPERATIONAL_PAGES = 100;
const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export async function loadPartnerEvents(input: {
  studio: 'host' | 'venue';
  cursor?: string | undefined;
}): Promise<PartnerEventsData> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');
  const client = createServerApiClient(cookieHeader);

  if (input.studio === 'venue') {
    const events: VenueOperationalEventDto[] = [];
    let cursor = input.cursor;
    let complete = true;
    let nextCursor: string | null = null;
    let total = 0;

    for (let page = 0; page < MAX_OPERATIONAL_PAGES; page += 1) {
      const search = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) search.set('cursor', cursor);
      const response = await client.get({
        path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/venue-events?${search.toString()}`,
        schema: venueOperationalEventListResponseSchema,
        headers: { 'x-organization-id': organizationId },
      });
      events.push(...response.items);
      complete &&= response.complete;
      total = response.pageInfo.total;
      nextCursor = response.pageInfo.nextCursor;
      if (!nextCursor) break;
      cursor = nextCursor;
      if (page === MAX_OPERATIONAL_PAGES - 1) complete = false;
    }

    return {
      dataStatus: 'api',
      pendingRequestCount: null,
      total,
      nextCursor,
      complete,
      events: events.map(mapVenueEvent),
    };
  }

  const search = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (input.cursor) search.set('cursor', input.cursor);
  const response = await client.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/events?${search.toString()}`,
    schema: organizationEventListResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });
  return {
    dataStatus: 'api',
    pendingRequestCount: null,
    total: response.pageInfo.total,
    nextCursor: response.pageInfo.nextCursor,
    events: response.items.map((item) => mapEvent(item, organizationId)),
  };
}

function mapVenueEvent(item: VenueOperationalEventDto): PartnerEventRecord {
  const date = new Date(item.startAt);
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: PRODUCT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const endAt = item.endAt ? new Date(item.endAt) : null;
  const basePriceLabel = item.isFree
    ? 'Free'
    : item.baseStartingPricePaise === null
      ? 'Not set'
      : currency.format(item.baseStartingPricePaise / 100);
  const currentPriceLabel = item.isFree
    ? 'Free'
    : item.currentStartingPricePaise === null
      ? 'No active price'
      : currency.format(item.currentStartingPricePaise / 100);

  return {
    id: item.id,
    name: item.title,
    tag: item.ownerType === 'host' ? 'Host event' : 'Venue event',
    status: mapStatus(item.status, date, endAt),
    party: item.ownerType === 'host' ? 'hosts' : 'venue',
    venue: item.venueName,
    host: item.hostName ?? 'Host name unavailable',
    hostInitials: initials(item.hostName),
    ...(item.ownerType === 'host' && item.hostName
      ? { hostLabel: `Hosted by ${item.hostName}` }
      : {}),
    dateLabel: item.status === 'postponed' ? 'New date to be announced' : formatter.format(date),
    timeLabel:
      item.status === 'postponed'
        ? 'On hold'
        : `${value('hour')}:${value('minute')} ${value('dayPeriod')}`,
    dayLabel: value('day'),
    monthLabel: value('month').toUpperCase(),
    priceLabel: currentPriceLabel,
    basePriceLabel,
    sold: item.ticketUnitsIssued,
    capacity: item.venueCapacity,
    salesCountComplete: item.operationalCountsComplete,
    operational: {
      eventCapacity: item.eventCapacity,
      venueCapacity: item.venueCapacity,
      ticketUnitsIssued: item.ticketUnitsIssued,
      rsvpUnitsIssued: item.rsvpUnitsIssued,
      expectedGuests: item.expectedGuests,
      checkedInGuests: item.checkedInGuests,
      complete: item.operationalCountsComplete,
    },
    revenueLabel: 'Revenue is not shown in Venue operations',
    artwork: item.imageUrl
      ? { type: 'image', value: item.imageUrl, alt: item.title }
      : { type: 'gradient', value: 'placeholder' },
  };
}

function mapEvent(
  item: ReturnType<typeof organizationEventListResponseSchema.parse>['items'][number],
  activeOrganizationId: string,
): PartnerEventRecord {
  const date = new Date(item.startAt);
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: PRODUCT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const status = mapStatus(item.status, date, item.endAt ? new Date(item.endAt) : null);
  const artwork = item.imageUrl
    ? { type: 'image' as const, value: item.imageUrl, alt: item.title }
    : { type: 'gradient' as const, value: 'placeholder' };
  const priceLabel = item.isFree
    ? 'Free'
    : item.currentStartingPricePaise == null
      ? 'No active price'
      : currency.format(item.currentStartingPricePaise / 100);
  const basePriceLabel = item.isFree
    ? 'Free'
    : item.startingPricePaise === null
      ? 'Not set'
      : currency.format(item.startingPricePaise / 100);

  return {
    id: item.id,
    name: item.title,
    tag: item.tags[0] ?? 'Event',
    status,
    party: item.organizationId !== activeOrganizationId ? 'hosts' : 'venue',
    venue: item.venueName ?? 'Venue not specified',
    host: 'Host details unavailable',
    hostInitials: '—',
    dateLabel: item.status === 'postponed' ? 'New date to be announced' : formatter.format(date),
    timeLabel:
      item.status === 'postponed'
        ? 'On hold'
        : `${value('hour')}:${value('minute')} ${value('dayPeriod')}`,
    dayLabel: value('day'),
    monthLabel: value('month').toUpperCase(),
    priceLabel,
    basePriceLabel,
    sold: item.ticketsSold,
    capacity: item.capacity,
    salesCountComplete: item.salesCountComplete,
    revenueLabel: 'Revenue unavailable in this view',
    artwork,
  };
}

function initials(name: string | null): string {
  if (!name) return '—';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function mapStatus(
  status: string,
  startAt: Date,
  endAt: Date | null,
  now = new Date(),
): PartnerEventRecord['status'] {
  const completed = (endAt ?? startAt).getTime() <= now.getTime();
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'review':
      return 'Review';
    case 'scheduled':
      return 'Scheduled';
    case 'published':
      return completed ? 'Completed' : startAt.getTime() > now.getTime() ? 'Scheduled' : 'Live';
    case 'started':
      return completed ? 'Completed' : 'Live';
    case 'postponed':
      return 'Postponed';
    case 'sales_paused':
      return completed ? 'Completed' : 'Paused';
    case 'ended':
      return 'Completed';
    case 'archived':
      return 'Archived';
    case 'cancelled':
      return 'Cancelled';
    default:
      return completed ? 'Completed' : 'Draft';
  }
}

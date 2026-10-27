import 'server-only';

import { cookies } from 'next/headers';

import { paginatedSchema } from '@c1rcle/api-client';
import { eventDtoSchema, promoterAssignedEventDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { PromoterEventsData } from '@/data/partner-data-source';
import type { ServerApiClient } from '@/lib/api/server-client';

export async function loadPromoterEvents(
  options: {
    readonly client?: ServerApiClient;
    readonly organizationId?: string | null;
  } = {},
): Promise<PromoterEventsData> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = options.organizationId ?? getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before viewing promoter events.');
  const client = options.client ?? createServerApiClient(cookieHeader);
  const headers = { 'x-organization-id': organizationId };
  const [assigned, publicEvents] = await Promise.all([
    client.get({
      path: `/api/v2/promoters/${encodeURIComponent(organizationId)}/events`,
      schema: promoterAssignedEventDtoSchema.array(),
      headers,
    }),
    client.get({
      path: '/api/v2/public/events?limit=100',
      schema: paginatedSchema(eventDtoSchema),
    }),
  ]);
  const linkedEvents = assigned.map(({ event, assignment }) => ({
    id: event.id,
    name: event.title,
    venue: event.venueId ? 'Venue details unavailable' : 'Venue not specified',
    city: '',
    clicks: null,
    sales: null,
    artwork: event.imageUrl
      ? { type: 'image' as const, value: event.imageUrl, alt: event.title }
      : { type: 'gradient' as const, value: 'placeholder' },
    commissionLabel: `${String(assignment.terms.ratePercent)}%${assignment.terms.tierRates ? ' base; tier-specific rates also apply' : ' commission'}${assignment.terms.flatPaise ? ` + ₹${(assignment.terms.flatPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}`,
  }));
  const discoverEvents = publicEvents.items.map((event) => {
    const date = new Date(event.startAt);
    return {
      id: event.id,
      name: event.title,
      venue: event.venueId ? 'Venue details unavailable' : 'Venue not specified',
      city: '',
      dateLabel: new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
      }).format(date),
      timeLabel: new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        timeStyle: 'short',
      }).format(date),
      accessState: 'public' as const,
      artwork: event.imageUrl
        ? { type: 'image' as const, value: event.imageUrl, alt: event.title }
        : { type: 'gradient' as const, value: 'placeholder' },
    };
  });
  return {
    dataStatus: 'api',
    discoverCount: discoverEvents.length,
    linkedCount: linkedEvents.length,
    discoverTotal: publicEvents.pageInfo.total,
    discoverHasMore: publicEvents.pageInfo.hasNextPage,
    discoverEvents,
    linkedEvents,
  };
}

import 'server-only';

import { cookies } from 'next/headers';

import { paginatedSchema } from '@c1rcle/api-client';
import {
  PRODUCT_TIME_ZONE,
  eventDtoSchema,
  promoterAssignedEventDtoSchema,
  promoterAssignmentDtoSchema,
  referralLinkDtoSchema,
  venueDtoSchema,
} from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { formatProductDateTime } from '@/lib/events/event-time';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { PartnerEventStatus, PromoterEventsData } from '@/data/partner-data-source';
import type { ServerApiClient } from '@/lib/api/server-client';
import type { EventDto } from '@c1rcle/contracts';

function partnerEventStatus(status: string): PartnerEventStatus {
  switch (status) {
    case 'published':
    case 'started':
      return 'Live';
    case 'draft':
      return 'Draft';
    case 'review':
      return 'Review';
    case 'scheduled':
      return 'Scheduled';
    case 'postponed':
      return 'Postponed';
    case 'sales_paused':
      return 'Paused';
    case 'ended':
      return 'Past';
    case 'archived':
      return 'Archived';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Draft';
  }
}

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
  const [invitationAssignments, referralLinks] = await Promise.all([
    client.get({
      path: `/api/v2/promoters/${encodeURIComponent(organizationId)}/assignment-invitations`,
      schema: promoterAssignmentDtoSchema.array(),
      headers,
    }),
    client.get({
      path: `/api/v2/promoters/${encodeURIComponent(organizationId)}/referral-links?limit=100`,
      schema: paginatedSchema(referralLinkDtoSchema),
      headers,
    }),
  ]);
  const invitationEvents = await Promise.all(
    invitationAssignments.map(async (assignment) => ({
      assignment,
      event: await client.get({
        path: `/api/v2/public/events/${encodeURIComponent(assignment.eventId)}`,
        schema: eventDtoSchema,
      }),
    })),
  );
  const venueIds = [
    ...new Set(
      [...assigned.map(({ event }) => event), ...invitationEvents.map(({ event }) => event)]
        .map((event) => event.venueId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const venueSummaries = await Promise.all(
    venueIds.map(async (venueId) => {
      const venue = await client
        .get({
          path: `/api/v2/public/venues/by-id/${encodeURIComponent(venueId)}`,
          schema: venueDtoSchema,
        })
        .catch(() => null);
      return [venueId, venue] as const;
    }),
  );
  const venueById = new Map(venueSummaries);
  const venueNameFor = (event: EventDto) => {
    const venue = event.venueId ? venueById.get(event.venueId) : null;
    return (
      venue?.name ??
      event.externalLocation?.name ??
      (event.venueId ? 'Venue details unavailable' : 'Venue not specified')
    );
  };
  const venueCityFor = (event: EventDto) => {
    const venue = event.venueId ? venueById.get(event.venueId) : null;
    return venue?.city ?? event.externalLocation?.city ?? '';
  };
  const eventMetrics = new Map<string, { clicks: number; sales: number }>();
  for (const link of referralLinks.items) {
    const metrics = eventMetrics.get(link.eventId) ?? { clicks: 0, sales: 0 };
    metrics.clicks += link.clicks;
    metrics.sales += link.conversions;
    eventMetrics.set(link.eventId, metrics);
  }
  const linkedEvents = assigned.map(({ event, assignment }) => ({
    id: event.id,
    venueId: event.venueId,
    assignmentId: assignment.id,
    assignmentVersion: assignment.version,
    assignmentStatus: assignment.status,
    ratePercent: assignment.terms.ratePercent,
    flatPaise: assignment.terms.flatPaise,
    eligibleTierIds: assignment.eligibleTierIds,
    ...(assignment.terms.tierRates ? { tierRates: assignment.terms.tierRates } : {}),
    startsAt: assignment.startsAt,
    expiresAt: assignment.expiresAt,
    eventDateTime: formatProductDateTime(event.startAt),
    eventStatus: partnerEventStatus(event.status),
    name: event.title,
    venue: venueNameFor(event),
    city: venueCityFor(event),
    clicks: eventMetrics.get(event.id)?.clicks ?? 0,
    sales: eventMetrics.get(event.id)?.sales ?? 0,
    artwork: event.imageUrl
      ? { type: 'image' as const, value: event.imageUrl, alt: event.title }
      : { type: 'gradient' as const, value: 'placeholder' },
    commissionLabel: `${String(assignment.terms.ratePercent)}%${assignment.terms.tierRates ? ' base; tier-specific rates also apply' : ' commission'}${assignment.terms.flatPaise ? ` + ₹${(assignment.terms.flatPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}`,
  }));
  const mappedInvitationEvents = invitationEvents.map(({ assignment, event }) => {
    return {
      id: event.id,
      venueId: event.venueId,
      assignmentId: assignment.id,
      assignmentVersion: assignment.version,
      assignmentStatus: assignment.status,
      ratePercent: assignment.terms.ratePercent,
      flatPaise: assignment.terms.flatPaise,
      eligibleTierIds: assignment.eligibleTierIds,
      ...(assignment.terms.tierRates ? { tierRates: assignment.terms.tierRates } : {}),
      startsAt: assignment.startsAt,
      expiresAt: assignment.expiresAt,
      eventDateTime: formatProductDateTime(event.startAt),
      eventStatus: partnerEventStatus(event.status),
      name: event.title,
      venue: venueNameFor(event),
      city: venueCityFor(event),
      clicks: 0,
      sales: 0,
      artwork: event.imageUrl
        ? { type: 'image' as const, value: event.imageUrl, alt: event.title }
        : { type: 'gradient' as const, value: 'placeholder' },
      commissionLabel: `${String(assignment.terms.ratePercent)}%${assignment.terms.tierRates ? ' base; tier-specific rates also apply' : ' commission'}${assignment.terms.flatPaise ? ` + ₹${(assignment.terms.flatPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}`,
    };
  });
  const discoverEvents = publicEvents.items.map((event) => {
    const date = new Date(event.startAt);
    return {
      id: event.id,
      venueId: event.venueId,
      name: event.title,
      venue: event.venueId ? 'Venue details unavailable' : 'Venue not specified',
      city: '',
      dateLabel: new Intl.DateTimeFormat('en-IN', {
        timeZone: PRODUCT_TIME_ZONE,
        dateStyle: 'medium',
      }).format(date),
      timeLabel: new Intl.DateTimeFormat('en-IN', {
        timeZone: PRODUCT_TIME_ZONE,
        timeStyle: 'short',
      }).format(date),
      summary: event.summary,
      description: event.description,
      eventStatus: partnerEventStatus(event.status),
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
    invitations: mappedInvitationEvents,
    referralLinks: referralLinks.items,
    referralLinkTotal: referralLinks.pageInfo.total,
    referralLinksHaveMore: referralLinks.pageInfo.hasNextPage,
  };
}

export async function loadPromoterEventVenue(venueId: string) {
  const cookieHeader = (await cookies()).toString();
  return createServerApiClient(cookieHeader)
    .get({
      path: `/api/v2/public/venues/by-id/${encodeURIComponent(venueId)}`,
      schema: venueDtoSchema,
    })
    .then((venue) => ({ name: venue.name, city: venue.city }));
}

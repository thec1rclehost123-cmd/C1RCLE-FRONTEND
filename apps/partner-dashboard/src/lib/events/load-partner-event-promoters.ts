import 'server-only';

import { cookies } from 'next/headers';
import { z } from 'zod';

import { paginatedSchema } from '@c1rcle/api-client';
import {
  promoterAssignmentDtoSchema,
  promoterAssignmentCandidateDtoSchema,
  eventPromoterAnalyticsDtoSchema,
  referralLinkDtoSchema,
  ticketTierDtoSchema,
} from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type {
  PromoterAssignmentDto,
  PromoterAssignmentCandidateDto,
  EventPromoterAnalyticsDto,
  ReferralLinkDto,
  TicketTierDto,
} from '@c1rcle/contracts';

export async function loadPartnerEventPromoters(eventId: string): Promise<{
  readonly links: readonly ReferralLinkDto[];
  readonly assignments: readonly PromoterAssignmentDto[];
  readonly connections: readonly PromoterAssignmentCandidateDto[];
  readonly tiers: readonly TicketTierDto[];
  readonly performance: EventPromoterAnalyticsDto;
}> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select an organization before viewing promoter metrics.');

  const client = createServerApiClient(cookieHeader);
  const headers = { 'x-organization-id': organizationId };
  const [links, assignments, connections, tiers, performance] = await Promise.all([
    client.get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/referral-links?limit=100`,
      schema: paginatedSchema(referralLinkDtoSchema),
      headers,
    }),
    client.get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/promoter-assignments`,
      schema: z.array(promoterAssignmentDtoSchema),
      headers,
    }),
    client.get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/promoter-candidates`,
      schema: z.array(promoterAssignmentCandidateDtoSchema),
      headers,
    }),
    client.get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/ticket-tiers`,
      schema: z.array(ticketTierDtoSchema),
      headers,
    }),
    client.get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/promoter-analytics`,
      schema: eventPromoterAnalyticsDtoSchema,
      headers,
    }),
  ]);
  return {
    links: links.items,
    assignments,
    connections,
    tiers: tiers.filter(
      (tier) =>
        tier.status === 'active' && tier.commissionEligible === true && tier.accessType !== 'RSVP',
    ),
    performance,
  };
}

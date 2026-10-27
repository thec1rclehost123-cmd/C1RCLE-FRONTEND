import 'server-only';

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { isApiClientError } from '@c1rcle/api-client';
import { eventAnalyticsDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { EventAnalyticsDto } from '@c1rcle/contracts';

/**
 * Loads the event-scoped analytics projection. The event ID stays in the URL
 * while the active organization travels in the required tenancy header; the
 * gateway additionally enforces `event.read`, so this loader cannot turn a
 * guessed event ID into cross-tenant data.
 */
export async function loadPartnerEventAnalytics(eventId: string): Promise<EventAnalyticsDto> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');
  try {
    return await createServerApiClient(cookieHeader).get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/analytics`,
      schema: eventAnalyticsDtoSchema,
      headers: { 'x-organization-id': organizationId },
    });
  } catch (error) {
    if (isApiClientError(error) && error.status === 404) notFound();
    throw error;
  }
}

import 'server-only';

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { isApiClientError } from '@c1rcle/api-client';
import { eventBookingHeatmapDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { EventBookingHeatmapDto } from '@c1rcle/contracts';

export async function loadPartnerEventBookingHeatmap(
  eventId: string,
): Promise<EventBookingHeatmapDto> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');
  try {
    return await createServerApiClient(cookieHeader).get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/analytics/booking-heatmap`,
      schema: eventBookingHeatmapDtoSchema,
      headers: { 'x-organization-id': organizationId },
    });
  } catch (error) {
    if (isApiClientError(error) && error.status === 404) notFound();
    throw error;
  }
}

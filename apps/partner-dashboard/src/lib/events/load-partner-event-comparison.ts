import 'server-only';

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { isApiClientError } from '@c1rcle/api-client';
import { eventComparisonResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { EventComparisonResponse } from '@c1rcle/contracts';

export async function loadPartnerEventComparison(
  eventId: string,
): Promise<EventComparisonResponse> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');
  try {
    return await createServerApiClient(cookieHeader).get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/comparison`,
      schema: eventComparisonResponseSchema,
      headers: { 'x-organization-id': organizationId },
    });
  } catch (error) {
    if (isApiClientError(error) && error.status === 404) notFound();
    throw error;
  }
}

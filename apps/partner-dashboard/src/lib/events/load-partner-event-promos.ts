import 'server-only';

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { isApiClientError } from '@c1rcle/api-client';
import { paginatedSchema, promoCodeDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { PromoCodeDto } from '@c1rcle/contracts';

const promoListSchema = paginatedSchema(promoCodeDtoSchema);

/** Loads event-scoped promo usage through the same organization authorization as analytics. */
export async function loadPartnerEventPromos(eventId: string): Promise<PromoCodeDto[]> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');

  try {
    const page = await createServerApiClient(cookieHeader).get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/promo-codes?limit=100`,
      schema: promoListSchema,
      headers: { 'x-organization-id': organizationId },
    });
    return page.items;
  } catch (error) {
    if (isApiClientError(error) && error.status === 404) notFound();
    throw error;
  }
}

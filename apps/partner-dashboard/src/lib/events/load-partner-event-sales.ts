import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { financeOrderListResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { FinanceOrderDto } from '@c1rcle/contracts';

export async function loadPartnerEventSales(eventId: string): Promise<readonly FinanceOrderDto[]> {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) redirect('/partner/select-organization');

  const response = await createServerApiClient(cookieHeader).get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/finance/orders?limit=100`,
    schema: financeOrderListResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });
  return response.items.filter((order) => order.eventId === eventId);
}

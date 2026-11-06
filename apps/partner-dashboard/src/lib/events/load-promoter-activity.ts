import 'server-only';

import { cookies } from 'next/headers';

import { paginatedSchema } from '@c1rcle/api-client';
import { eventDtoSchema, promoterAttributedOrderListResponseSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export async function loadPromoterActivity() {
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId) throw new Error('Select a Promoter organization to view activity.');
  const client = createServerApiClient(cookieHeader);
  const [orders, events] = await Promise.all([
    client.get({
      path: `/api/v2/promoters/${encodeURIComponent(organizationId)}/attributed-orders?limit=100`,
      schema: promoterAttributedOrderListResponseSchema,
      headers: { 'x-organization-id': organizationId },
    }),
    client.get({
      path: '/api/v2/public/events?limit=100',
      schema: paginatedSchema(eventDtoSchema),
    }),
  ]);
  const eventNames = new Map(events.items.map((event) => [event.id, event.title]));
  return {
    rows: orders.items.map((order) => ({
      ...order,
      eventName: eventNames.get(order.eventId) ?? 'Event',
    })),
    hasMore: orders.pageInfo.hasNextPage,
  };
}

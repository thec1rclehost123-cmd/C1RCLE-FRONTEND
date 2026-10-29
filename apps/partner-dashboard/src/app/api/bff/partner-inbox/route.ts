import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  markAllNotificationsReadResultSchema,
  notificationDtoSchema,
  notificationsListResponseSchema,
  opaqueIdSchema,
} from '@c1rcle/contracts';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayAuthInit,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

const inboxQuerySchema = z.object({
  organizationId: opaqueIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.string().max(1024).optional(),
});

const inboxMutationSchema = z.union([
  z.object({ organizationId: opaqueIdSchema, notificationId: opaqueIdSchema }),
  z.object({ organizationId: opaqueIdSchema, readAll: z.literal(true) }),
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;

  const parsedQuery = inboxQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsedQuery.success) {
    return errorEnvelope('validation', 'A valid organization and inbox page are required.', 400);
  }

  const { organizationId, limit, cursor } = parsedQuery.data;
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor !== undefined) query.set('cursor', cursor);
  const { cookie, headers } = gatewayAuthInit(req);
  const response = await forwardToGateway(
    `/api/v2/organizations/${encodeURIComponent(organizationId)}/notifications?${query.toString()}`,
    {
      method: 'GET',
      cookie,
      headers: { ...headers, 'x-organization-id': organizationId },
    },
  ).catch(() => null);

  if (response === null)
    return errorEnvelope('server', 'The notification service is unavailable.', 502);
  const bodyText = await response.text();
  if (!response.ok)
    return passThroughGatewayError(response.status, bodyText, response.headers.get('retry-after'));

  try {
    const result = notificationsListResponseSchema.safeParse(parseJson(bodyText));
    if (!result.success)
      return errorEnvelope('server', 'The notification response was invalid.', 502);
    return NextResponse.json(result.data, { status: 200 });
  } catch {
    return errorEnvelope('server', 'The notification response was invalid.', 502);
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const csrfError = assertCsrf(req);
  if (csrfError !== null) return csrfError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorEnvelope('validation', 'A valid inbox update is required.', 400);
  }
  const parsedBody = inboxMutationSchema.safeParse(body);
  if (!parsedBody.success)
    return errorEnvelope('validation', 'A valid inbox update is required.', 400);

  const { organizationId } = parsedBody.data;
  const path =
    'readAll' in parsedBody.data
      ? `/api/v2/organizations/${encodeURIComponent(organizationId)}/notifications/read-all`
      : `/api/v2/organizations/${encodeURIComponent(organizationId)}/notifications/${encodeURIComponent(parsedBody.data.notificationId)}/read`;
  const { cookie, headers } = gatewayAuthInit(req);
  const response = await forwardToGateway(path, {
    method: 'PATCH',
    body: {},
    cookie,
    headers: { ...headers, 'x-organization-id': organizationId },
  }).catch(() => null);

  if (response === null)
    return errorEnvelope('server', 'The notification service is unavailable.', 502);
  const bodyText = await response.text();
  if (!response.ok)
    return passThroughGatewayError(response.status, bodyText, response.headers.get('retry-after'));

  try {
    const schema =
      'readAll' in parsedBody.data ? markAllNotificationsReadResultSchema : notificationDtoSchema;
    const result = schema.safeParse(parseJson(bodyText));
    if (!result.success)
      return errorEnvelope('server', 'The notification response was invalid.', 502);
    return NextResponse.json(result.data, { status: 200 });
  } catch {
    return errorEnvelope('server', 'The notification response was invalid.', 502);
  }
}

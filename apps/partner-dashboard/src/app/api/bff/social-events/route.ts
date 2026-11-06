import { NextResponse } from 'next/server';

import { opaqueIdSchema } from '@c1rcle/contracts';
import { managedSocialEventsSchema, socialEventPolicySchema } from '@c1rcle/contracts/guest-social';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayAuthInit,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

async function handle(request: NextRequest) {
  const origin = assertSameOrigin(request);
  if (origin) return origin;
  const organization = opaqueIdSchema.safeParse(request.nextUrl.searchParams.get('organizationId'));
  if (!organization.success) return errorEnvelope('validation', 'Choose an organization.', 422);
  const auth = gatewayAuthInit(request);
  if (!auth.cookie && !auth.headers?.['Authorization'])
    return errorEnvelope('unauthorized', 'Sign in to continue.', 401);
  if (request.method !== 'GET') {
    const csrf = assertCsrf(request);
    if (csrf) return csrf;
  }
  const path = `/api/v2/organizations/${encodeURIComponent(organization.data)}/social-events`;
  try {
    let response: Response;
    if (request.method === 'GET')
      response = await forwardToGateway(path, {
        method: 'GET',
        ...auth,
        headers: { ...auth.headers, 'x-organization-id': organization.data },
      });
    else {
      const body = socialEventPolicySchema
        .extend({ eventId: opaqueIdSchema })
        .strict()
        .safeParse(await request.json());
      if (!body.success)
        return errorEnvelope('validation', 'Choose an event and visibility setting.', 422);
      response = await forwardToGateway(`${path}/${encodeURIComponent(body.data.eventId)}`, {
        method: 'PATCH',
        body: { enabled: body.data.enabled },
        ...auth,
        headers: { ...auth.headers, 'x-organization-id': organization.data },
      });
    }
    if (!response.ok) return passThroughGatewayError(response.status, await response.text());
    const schema = request.method === 'GET' ? managedSocialEventsSchema : socialEventPolicySchema;
    const body = schema.safeParse(await response.json());
    return body.success
      ? NextResponse.json(body.data)
      : errorEnvelope('server', 'Social settings are temporarily unavailable.', 502);
  } catch {
    return errorEnvelope('server', 'Social settings are temporarily unavailable.', 502);
  }
}
async function privateHandler(request: NextRequest) {
  const response = await handle(request);
  response.headers.set('cache-control', 'private, no-store');
  return response;
}
export const GET = privateHandler;
export const PATCH = privateHandler;

import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  forwardToGateway,
  gatewayAuthInit,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

interface RouteParams {
  readonly params: Promise<{ readonly id: string; readonly notificationId: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }
  const csrfError = assertCsrf(req);
  if (csrfError !== null) {
    return csrfError;
  }

  const { id, notificationId } = await ctx.params;
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const gatewayResponse = await forwardToGateway(
    `/api/v2/organizations/${id}/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      cookie,
      headers: {
        ...authHeaders,
        // The gateway scopes the inbox to the requested org.
        'x-organization-id': id,
      },
    },
  );
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

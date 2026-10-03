import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  forwardToGateway,
  gatewayAuthInit,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface RouteParams {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const { id } = await ctx.params;
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const gatewayResponse = await forwardToGateway(
    `/api/v2/organizations/${encodeURIComponent(id)}/notifications${req.nextUrl.search}`,
    {
      method: 'GET',
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

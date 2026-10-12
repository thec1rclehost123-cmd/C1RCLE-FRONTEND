import { NextResponse } from 'next/server';

import {
  assertPathId,
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

/**
 * BFF route for a single support ticket.
 * GET - retrieves the ticket by ID
 */
export async function GET(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const { id } = await ctx.params;
  const idError = assertPathId(id);
  if (idError !== null) {
    return idError;
  }

  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const gatewayResponse = await forwardToGateway(`/api/v2/support/tickets/${id}`, {
    method: 'GET',
    cookie,
    ...(authHeaders ? { headers: authHeaders } : {}),
  });

  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

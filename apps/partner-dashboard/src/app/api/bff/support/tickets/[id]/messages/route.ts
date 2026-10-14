import { NextResponse } from 'next/server';

import {
  assertPathId,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayAuthInit,
  mintIdempotencyKey,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface RouteParams {
  readonly params: Promise<{ readonly id: string }>;
}

/**
 * BFF route for posting a message reply to a support ticket.
 * POST - appends a reply from the partner to the ticket conversation
 */
export async function POST(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const { id } = await ctx.params;
  const idError = assertPathId(id);
  if (idError !== null) {
    return idError;
  }

  const body: unknown = await req.json().catch(() => undefined);
  if (body === undefined) {
    return errorEnvelope('bad_request', 'Invalid JSON payload.', 400);
  }

  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const idempotencyKey = mintIdempotencyKey();

  const gatewayResponse = await forwardToGateway(`/api/v2/support/tickets/${id}/messages`, {
    method: 'POST',
    cookie,
    headers: {
      ...authHeaders,
      'idempotency-key': idempotencyKey,
    },
    body,
  });

  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: gatewayResponse.status });
}

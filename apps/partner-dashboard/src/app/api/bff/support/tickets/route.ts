import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayAuthInit,
  mintIdempotencyKey,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/**
 * BFF route for partner support tickets collection.
 * GET  - lists tickets belonging to the authenticated partner actor
 * POST - submits a new support ticket to the gateway
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const search = req.nextUrl.search;
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const gatewayResponse = await forwardToGateway(`/api/v2/support/tickets${search}`, {
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const body: unknown = await req.json().catch(() => undefined);
  if (body === undefined) {
    return errorEnvelope('bad_request', 'Invalid JSON payload.', 400);
  }

  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const idempotencyKey = mintIdempotencyKey();

  const gatewayResponse = await forwardToGateway('/api/v2/support/tickets', {
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

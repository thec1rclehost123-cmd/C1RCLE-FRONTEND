import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/gateway-proxy';

import type { NextRequest } from 'next/server';

/**
 * BFF for the guest Help intake (`/api/v2/support/tickets`).
 *
 * GET  — the caller's own tickets (query params forwarded to the gateway).
 * POST — submit a new ticket.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const search = request.nextUrl.search;
  const gatewayResponse = await forwardToGateway(`/api/v2/support/tickets${search}`, {
    method: 'GET',
    cookie: request.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }
  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(request);
  if (originError !== null) {
    return originError;
  }
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) {
    return errorEnvelope('bad_request', 'Invalid JSON body.', 400);
  }

  const gatewayResponse = await forwardToGateway('/api/v2/support/tickets', {
    method: 'POST',
    cookie: request.headers.get('cookie'),
    body,
  });
  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }
  return NextResponse.json(parseJson(bodyText), { status: gatewayResponse.status });
}

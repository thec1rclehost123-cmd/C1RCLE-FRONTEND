import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/help/gateway-proxy';

import type { NextRequest } from 'next/server';

/** BFF for replying from a guest ticket (POST `/api/v2/support/tickets/:ticketId/messages`). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
): Promise<NextResponse> {
  const originError = assertSameOrigin(request);
  if (originError !== null) {
    return originError;
  }
  const { ticketId } = await context.params;
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) {
    return errorEnvelope('bad_request', 'Invalid JSON body.', 400);
  }

  const gatewayResponse = await forwardToGateway(`/api/v2/support/tickets/${ticketId}/messages`, {
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
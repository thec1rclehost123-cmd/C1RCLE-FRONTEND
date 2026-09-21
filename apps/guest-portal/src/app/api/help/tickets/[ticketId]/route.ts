import { NextResponse } from 'next/server';

import { forwardToGateway, parseJson, passThroughGatewayError } from '@/lib/help/gateway-proxy';

import type { NextRequest } from 'next/server';

/** BFF for a single ticket — the login-scoped detail route (`GET /api/v2/support/tickets/:ticketId`). */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
): Promise<NextResponse> {
  const { ticketId } = await context.params;
  const gatewayResponse = await forwardToGateway(`/api/v2/support/tickets/${ticketId}`, {
    method: 'GET',
    cookie: request.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }
  return NextResponse.json(parseJson(bodyText), { status: 200 });
}
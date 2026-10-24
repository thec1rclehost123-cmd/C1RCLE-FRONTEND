import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface TicketQrRouteContext {
  params: Promise<{ ticketId: string }>;
}

/**
 * BFF: `GET /api/tickets/:ticketId/qr` → gateway `GET /api/v2/tickets/:ticketId/qr`
 * — the holder's rotating entry credential (HMAC of ticket + 30s window).
 * Holder-or-staff only; a stranger gets the gateway's 404, never a code, so
 * confirming an id never returns 403. Same-origin guarded and always
 * `no-store`: a rotating credential must never sit in a cache.
 */
export async function GET(req: NextRequest, context: TicketQrRouteContext): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const { ticketId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(ticketId) || ticketId.length > 64) {
    return errorEnvelope('validation', 'Unknown ticket.', 404);
  }

  const gatewayResponse = await forwardToGateway(`/api/v2/tickets/${ticketId}/qr`, {
    method: 'GET',
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  const response = NextResponse.json(parseJson(bodyText), { status: 200 });
  response.headers.set('cache-control', 'no-store');
  return response;
}

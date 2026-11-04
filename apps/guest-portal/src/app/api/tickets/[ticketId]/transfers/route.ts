import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest } from 'next/server';

interface TicketTransfersRouteContext {
  params: Promise<{ ticketId: string }>;
}

export async function POST(
  req: NextRequest,
  context: TicketTransfersRouteContext,
): Promise<NextResponse> {
  const { ticketId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(ticketId)) {
    return errorEnvelope('not_found', 'Ticket unavailable.', 404);
  }
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/tickets/${encodeURIComponent(ticketId)}/transfers`,
    successStatus: 201,
    unauthenticatedMessage: 'Sign in to manage this ticket.',
    idempotent: true,
  });
}

export async function GET(
  req: NextRequest,
  context: TicketTransfersRouteContext,
): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const { ticketId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(ticketId)) {
    return errorEnvelope('not_found', 'Ticket unavailable.', 404);
  }
  const response = await forwardToGateway(
    `/api/v2/tickets/${encodeURIComponent(ticketId)}/transfers`,
    { method: 'GET', cookie: req.headers.get('cookie') },
  );
  const body = await response.text();
  if (!response.ok) {
    if (response.status === 401) return errorEnvelope('unauthorized', 'Not authenticated.', 401);
    return passThroughGatewayError(response.status, body);
  }
  return NextResponse.json(parseJson(body), { status: 200 });
}

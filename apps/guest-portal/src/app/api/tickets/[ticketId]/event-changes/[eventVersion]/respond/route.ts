import { errorEnvelope } from '@/lib/bff/auth-proxy';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

interface EventChangeResponseContext {
  params: Promise<{ ticketId: string; eventVersion: string }>;
}

export async function POST(
  req: NextRequest,
  context: EventChangeResponseContext,
): Promise<NextResponse> {
  const { ticketId, eventVersion } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(ticketId)) {
    return errorEnvelope('not_found', 'Ticket unavailable.', 404);
  }
  if (!/^[1-9][0-9]{0,8}$/.test(eventVersion)) {
    return errorEnvelope('bad_request', 'Event update unavailable.', 400);
  }
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/tickets/${encodeURIComponent(ticketId)}/event-changes/${eventVersion}/respond`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to respond to this event update.',
    idempotent: true,
  });
}

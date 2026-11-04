import { errorEnvelope } from '@/lib/bff/auth-proxy';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
): Promise<NextResponse> {
  const { ticketId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(ticketId))
    return errorEnvelope('not_found', 'Ticket unavailable.', 404);
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/tickets/${encodeURIComponent(ticketId)}/refund-review`,
    successStatus: 201,
    unauthenticatedMessage: 'Sign in to request a refund.',
    idempotent: true,
  });
}

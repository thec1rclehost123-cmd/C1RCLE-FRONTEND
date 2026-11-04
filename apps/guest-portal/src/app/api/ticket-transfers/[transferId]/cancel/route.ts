import { errorEnvelope } from '@/lib/bff/auth-proxy';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

interface TicketTransferCancelRouteContext {
  params: Promise<{ transferId: string }>;
}

export async function POST(
  req: NextRequest,
  context: TicketTransferCancelRouteContext,
): Promise<NextResponse> {
  const { transferId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(transferId)) {
    return errorEnvelope('not_found', 'Transfer unavailable.', 404);
  }
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/ticket-transfers/${encodeURIComponent(transferId)}/cancel`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to manage this ticket.',
    idempotent: true,
  });
}

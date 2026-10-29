import { type NextResponse, type NextRequest } from 'next/server';

import { errorEnvelope } from '@/lib/bff/auth-proxy';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

interface TicketTransferAcceptRouteContext {
  params: Promise<{ transferId: string }>;
}

export async function POST(
  req: NextRequest,
  context: TicketTransferAcceptRouteContext,
): Promise<NextResponse> {
  const { transferId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/.test(transferId)) {
    return errorEnvelope('not_found', 'Invitation unavailable.', 404);
  }
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/ticket-transfers/${encodeURIComponent(transferId)}/accept`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in with the invited email to accept this ticket.',
    idempotent: true,
  });
}

import { errorEnvelope } from '@/lib/bff/auth-proxy';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> },
): Promise<NextResponse> {
  const { orderId } = await context.params;
  if (!/^RSVP-[a-f0-9]{32}$/.test(orderId))
    return errorEnvelope('not_found', 'RSVP unavailable.', 404);
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/rsvp/${encodeURIComponent(orderId)}/cancel`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to cancel your RSVP.',
    idempotent: true,
  });
}

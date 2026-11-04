import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

export function POST(req: NextRequest): Promise<NextResponse> {
  return proxyGatewayWrite(req, {
    gatewayPath: '/api/v2/public/ticket-access-codes/redeem',
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to unlock this ticket tier.',
    idempotent: false,
  });
}

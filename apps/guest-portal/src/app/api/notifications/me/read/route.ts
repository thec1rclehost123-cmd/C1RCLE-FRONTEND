import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

export function POST(req: NextRequest): Promise<NextResponse> {
  return proxyGatewayWrite(req, {
    gatewayPath: '/api/v2/notifications/me/read',
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to update your notifications.',
    idempotent: true,
  });
}

import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

/**
 * BFF: `POST /api/checkout/holds` → gateway `POST /api/v2/checkout/holds`.
 * Reserves the selected inventory for the hold window. The browser supplies
 * one `Idempotency-Key` per checkout attempt, so a double-click replays the
 * same hold instead of reserving twice.
 */
export function POST(req: NextRequest): Promise<NextResponse> {
  return proxyGatewayWrite(req, {
    gatewayPath: '/api/v2/checkout/holds',
    successStatus: 201,
    unauthenticatedMessage: 'Sign in to continue to payment.',
    idempotent: true,
  });
}

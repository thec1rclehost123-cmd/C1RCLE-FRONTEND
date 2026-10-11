import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

/**
 * BFF: `POST /api/payments/attempts` → gateway `POST /api/v2/payments/attempts`.
 * Creates (or replays) the provider order for a hold and returns what the
 * Razorpay widget needs: the order id, the amount and the publishable key id.
 */
export function POST(req: NextRequest): Promise<NextResponse> {
  return proxyGatewayWrite(req, {
    gatewayPath: '/api/v2/payments/attempts',
    successStatus: 201,
    unauthenticatedMessage: 'Sign in to continue to payment.',
    idempotent: true,
  });
}

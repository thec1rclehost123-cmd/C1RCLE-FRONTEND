import { setPaymentRecoveryCookie } from '@/lib/bff/payment-recovery';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

/**
 * BFF: `POST /api/checkout/holds` → gateway `POST /api/v2/checkout/holds`.
 * Reserves the selected inventory for the hold window. The browser supplies
 * one `Idempotency-Key` per checkout attempt, so a double-click replays the
 * same hold instead of reserving twice.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const response = await proxyGatewayWrite(req, {
    gatewayPath: '/api/v2/checkout/holds',
    successStatus: 201,
    unauthenticatedMessage: 'Sign in to continue to payment.',
    idempotent: true,
  });
  if (response.ok) {
    const body = (await response.clone().json()) as { holdId?: unknown };
    if (typeof body.holdId === 'string' && /^[A-Za-z0-9_-]{3,128}$/.test(body.holdId)) {
      setPaymentRecoveryCookie(response, req, body.holdId);
    }
  }
  return response;
}

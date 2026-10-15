import { setPaymentRecoveryCookie } from '@/lib/bff/payment-recovery';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

/**
 * BFF: `POST /api/payments/attempts` → gateway `POST /api/v2/payments/attempts`.
 * Creates (or replays) the provider order for a hold and returns what the
 * Razorpay widget needs: the order id, the amount and the publishable key id.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let holdId: string | null = null;
  try {
    const body = (await req.clone().json()) as { holdId?: unknown };
    if (typeof body.holdId === 'string' && /^[A-Za-z0-9_-]{3,128}$/.test(body.holdId)) {
      holdId = body.holdId;
    }
  } catch {
    // The shared proxy returns the canonical validation error.
  }
  const response = await proxyGatewayWrite(req, {
    gatewayPath: '/api/v2/payments/attempts',
    successStatus: 201,
    unauthenticatedMessage: 'Sign in to continue to payment.',
    idempotent: true,
  });
  if (response.ok && holdId) {
    setPaymentRecoveryCookie(response, req, holdId);
  }
  return response;
}

import { errorEnvelope } from '@/lib/bff/auth-proxy';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

interface VerifyRouteContext {
  params: Promise<{ id: string }>;
}

/** Razorpay payment ids look like `pay_AbC123`; anything else is not one. */
const PAYMENT_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * BFF: `POST /api/payments/:id/verify` → gateway `POST /api/v2/payments/:id/verify`.
 * Hands the gateway what Razorpay's widget returned so it can verify the
 * signature and fulfil the order. The gateway is the only party that decides
 * whether the payment is genuine; this route only forwards it.
 */
export async function POST(req: NextRequest, context: VerifyRouteContext): Promise<NextResponse> {
  const { id } = await context.params;
  if (!PAYMENT_ID.test(id)) return errorEnvelope('validation', 'Unknown payment.', 404);

  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/payments/${id}/verify`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to confirm your payment.',
    idempotent: true,
  });
}

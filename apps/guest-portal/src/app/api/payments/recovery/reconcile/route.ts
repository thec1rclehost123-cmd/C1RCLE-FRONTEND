import { errorEnvelope } from '@/lib/bff/auth-proxy';
import { PAYMENT_RECOVERY_COOKIE } from '@/lib/bff/payment-recovery';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

/** Retry an owner-scoped provider reconciliation after a lost checkout callback. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const holdId = req.cookies.get(PAYMENT_RECOVERY_COOKIE)?.value;
  if (!holdId || !/^[A-Za-z0-9_-]{3,128}$/.test(holdId)) {
    return errorEnvelope('not_found', 'No payment is awaiting recovery.', 404);
  }

  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/payments/attempts/${encodeURIComponent(holdId)}/reconcile`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to recover your payment.',
    idempotent: true,
  });
}

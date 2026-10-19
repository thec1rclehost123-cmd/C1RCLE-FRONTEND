import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest, NextResponse } from 'next/server';

/**
 * BFF: `POST /api/checkout/quote` → gateway `POST /api/v2/checkout/quote`.
 * The server's real price (fees and GST included) for a selection, so the
 * browser never shows an invented total. Creates no hold.
 */
export function POST(req: NextRequest): Promise<NextResponse> {
  return proxyGatewayWrite(req, {
    gatewayPath: '/api/v2/checkout/quote',
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to continue to payment.',
    idempotent: false,
  });
}

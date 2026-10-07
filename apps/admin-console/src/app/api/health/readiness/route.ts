import { proxyGatewayHealth } from '@/lib/bff/health-proxy';

import type { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies the gateway's token-gated `/api/v2/internal/readiness` check. See
 * `lib/bff/health-proxy.ts` for why this can't be called directly from the
 * browser.
 */
export function GET(_req: NextRequest): Promise<NextResponse> {
  return proxyGatewayHealth('readiness');
}

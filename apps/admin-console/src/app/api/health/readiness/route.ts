import { NextResponse } from 'next/server';

import { getClientEnv } from '@c1rcle/config';

import type { NextRequest } from 'next/server';

/**
 * Proxies the gateway's token-gated `/api/v2/internal/readiness` check.
 * That endpoint is deliberately locked behind a shared-secret header at the
 * nginx edge (see `C1RCLE-BACKEND/deploy/nginx/templates/*.template` --
 * `$c1rcle_readiness_allowed`), so it can never be called directly from a
 * browser. This route holds the secret server-side only
 * (`GATEWAY_READINESS_TOKEN`, never `NEXT_PUBLIC_*`) and forwards the
 * response, same-origin, to the admin-console health page.
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const token = process.env['GATEWAY_READINESS_TOKEN'];
  if (token === undefined || token.length === 0) {
    return NextResponse.json(
      { ok: false, checks: {} },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }

  const base = getClientEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  const response = await fetch(`${base}/api/v2/internal/readiness`, {
    headers: { 'x-readiness-token': token },
    cache: 'no-store',
  });
  const body: unknown = await response.json().catch(() => ({ ok: false, checks: {} }));

  return NextResponse.json(body, {
    status: response.status,
    headers: { 'cache-control': 'no-store' },
  });
}

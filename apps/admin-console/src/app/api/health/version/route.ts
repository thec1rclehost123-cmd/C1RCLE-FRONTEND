import { NextResponse } from 'next/server';

import { getClientEnv } from '@c1rcle/config';

import type { NextRequest } from 'next/server';

/**
 * Proxies the gateway's token-gated `/api/v2/internal/version` check. See
 * `readiness/route.ts` for why this can't be called directly from the
 * browser.
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const token = process.env['GATEWAY_READINESS_TOKEN'];
  if (token === undefined || token.length === 0) {
    return NextResponse.json(
      { version: 'unknown', buildSha: 'unknown', commit: 'unknown', startedAt: '' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }

  const base = getClientEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  const response = await fetch(`${base}/api/v2/internal/version`, {
    headers: { 'x-readiness-token': token },
    cache: 'no-store',
  });
  const body: unknown = await response.json().catch(() => ({
    version: 'unknown',
    buildSha: 'unknown',
    commit: 'unknown',
    startedAt: '',
  }));

  return NextResponse.json(body, {
    status: response.status,
    headers: { 'cache-control': 'no-store' },
  });
}

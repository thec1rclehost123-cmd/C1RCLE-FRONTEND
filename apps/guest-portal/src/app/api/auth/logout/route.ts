import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  clearCsrfCookie,
  clearSessionCookie,
  forwardToGateway,
  rescopeSessionCookies,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }
  const csrfError = assertCsrf(req);
  if (csrfError !== null) {
    return csrfError;
  }

  // Best-effort revoke: even if the gateway call fails, the local cookies are
  // expired and the browser is logged out.
  const gatewayResponse = await forwardToGateway('/api/v2/auth/logout', {
    method: 'POST',
    cookie: req.headers.get('cookie'),
  }).catch(() => null);

  const res = new NextResponse(null, { status: 204 });
  if (gatewayResponse !== null) {
    rescopeSessionCookies(gatewayResponse, res);
  }
  // Unconditional: overrides anything the gateway (or its failure) left behind.
  clearSessionCookie(res);
  clearCsrfCookie(res);
  return res;
}

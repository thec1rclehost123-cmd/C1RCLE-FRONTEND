import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  clearCsrfCookie,
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
  // cleared and the client is logged out.
  const gatewayResponse = await forwardToGateway('/api/v2/auth/logout', {
    method: 'POST',
    cookie: req.headers.get('cookie'),
  }).catch(() => null);

  const res = new NextResponse(null, { status: 204 });
  if (gatewayResponse !== null) {
    // The gateway's logout response carries expired Set-Cookie headers;
    // re-scoping them to the FE origin clears them there too.
    rescopeSessionCookies(gatewayResponse, res);
  }
  clearCsrfCookie(res);
  return res;
}

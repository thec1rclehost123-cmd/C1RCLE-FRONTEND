import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  clearCsrfCookie,
  clearSessionCookie,
  forwardToGateway,
  gatewayUnreachable,
  parseJson,
  passThroughGatewayError,
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

  let gatewayResponse: Response;
  try {
    gatewayResponse = await forwardToGateway('/api/v2/auth/refresh', {
      method: 'POST',
      cookie: req.headers.get('cookie'),
    });
  } catch {
    return gatewayUnreachable();
  }
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    const res = passThroughGatewayError(gatewayResponse.status, bodyText);
    if (gatewayResponse.status === 401) {
      // Expired/revoked session: drop the dead cookies so the edge gate stops
      // treating the browser as signed in.
      clearSessionCookie(res);
      clearCsrfCookie(res);
    }
    return res;
  }

  const payload = parseJson(bodyText);
  if (payload === undefined) {
    return gatewayUnreachable();
  }
  const res = NextResponse.json(payload, { status: 200 });
  rescopeSessionCookies(gatewayResponse, res);
  return res;
}

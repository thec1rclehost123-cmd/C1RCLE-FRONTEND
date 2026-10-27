import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  csrfCookieName,
  mintCsrfToken,
  parseJson,
  passThroughGatewayError,
  setCsrfCookie,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const gatewayResponse = await forwardToGateway('/api/v2/auth/session', {
    method: 'GET',
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();

  if (gatewayResponse.status === 401) {
    return errorEnvelope('unauthorized', 'Not authenticated.', 401);
  }
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  const payload = parseJson(bodyText);
  if (payload === undefined) {
    return errorEnvelope('gateway_unavailable', 'Authentication service is unavailable.', 502);
  }

  const res = NextResponse.json(payload, { status: 200 });
  res.headers.set('Cache-Control', 'private, no-store');
  // Each app's auth client reads only its own CSRF cookie. A legacy shared
  // cookie from another localhost app cannot satisfy this app's refresh flow.
  if (!req.cookies.has(csrfCookieName())) {
    setCsrfCookie(res, mintCsrfToken());
  }
  return res;
}

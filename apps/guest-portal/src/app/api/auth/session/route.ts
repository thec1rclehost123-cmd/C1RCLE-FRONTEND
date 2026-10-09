import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  clearCsrfCookie,
  clearSessionCookie,
  csrfCookieName,
  errorEnvelope,
  forwardToGateway,
  gatewayUnreachable,
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

  let gatewayResponse: Response;
  try {
    gatewayResponse = await forwardToGateway('/api/v2/auth/session', {
      method: 'GET',
      cookie: req.headers.get('cookie'),
    });
  } catch {
    return gatewayUnreachable();
  }
  const bodyText = await gatewayResponse.text();

  if (gatewayResponse.status === 401) {
    const res = errorEnvelope('unauthorized', 'Not authenticated.', 401);
    clearSessionCookie(res);
    clearCsrfCookie(res);
    return res;
  }
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  const payload = parseJson(bodyText);
  if (payload === undefined) {
    return gatewayUnreachable();
  }
  const res = NextResponse.json(payload, { status: 200 });
  res.headers.set('Cache-Control', 'private, no-store');
  if (!req.cookies.has(csrfCookieName()) && !req.cookies.has('c1rcle.csrf')) {
    setCsrfCookie(res, mintCsrfToken());
  }
  return res;
}

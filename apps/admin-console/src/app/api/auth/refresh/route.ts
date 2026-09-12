import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  forwardToGateway,
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

  const gatewayResponse = await forwardToGateway('/api/v2/auth/refresh', {
    method: 'POST',
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  const res = NextResponse.json(parseJson(bodyText), { status: 200 });
  rescopeSessionCookies(gatewayResponse, res);
  return res;
}
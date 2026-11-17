import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  guestSessionResponse,
  mintCsrfToken,
  parseJson,
  passThroughGatewayError,
  rescopeSessionCookies,
  setCsrfCookie,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  let body: unknown;
  try {
    body = stripProtoKeys(await req.json());
  } catch {
    return errorEnvelope('validation', 'Request body must be valid JSON.', 400);
  }

  const gatewayResponse = await forwardToGateway('/api/v2/auth/signup', { method: 'POST', body });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  const res = NextResponse.json(guestSessionResponse(parseJson(bodyText)), { status: 201 });
  rescopeSessionCookies(gatewayResponse, res, req.nextUrl.protocol === 'https:');
  setCsrfCookie(res, mintCsrfToken(), req.nextUrl.protocol === 'https:');
  return res;
}

import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  csrfCookieName,
  gatewayAuthInit,
  mintCsrfToken,
  parseJson,
  passThroughGatewayError,
  setCsrfCookie,
  forwardToGateway,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const gatewayResponse = await forwardToGateway('/api/v2/onboarding/me', {
    method: 'GET',
    ...gatewayAuthInit(req),
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  const res = NextResponse.json(parseJson(bodyText), { status: 200 });
  // The CSRF cookie is set by login/signup, so a returning (already-signed-in)
  // applicant has none. Mint one here so the wizard's state-changing steps pass
  // the double-submit check without forcing a fresh login.
  if (!req.cookies.has(csrfCookieName())) {
    setCsrfCookie(res, mintCsrfToken());
  }
  return res;
}
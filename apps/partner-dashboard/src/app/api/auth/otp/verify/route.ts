import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/**
 * Real proxy to the V2 gateway's `POST /api/v2/auth/otp/verify` — replaces
 * the fixture that accepted `123456` or any 6-character code. Session-scoped,
 * same shape as `otp/send`: the session cookie and CSRF token must be present
 * (the code was issued to the signed-in applicant's address). Unlike `send`,
 * the gateway DOES surface a distinct 400 for a wrong/expired/locked code —
 * that specific failure reason is real UX (the user needs to know to try
 * again vs. request a new code), passed straight through unchanged.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }
  const csrfError = assertCsrf(req);
  if (csrfError !== null) {
    return csrfError;
  }

  let body: unknown;
  try {
    body = stripProtoKeys(await req.json());
  } catch {
    return errorEnvelope('validation', 'Request body must be valid JSON.', 400);
  }

  const gatewayResponse = await forwardToGateway('/api/v2/auth/otp/verify', {
    method: 'POST',
    body,
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

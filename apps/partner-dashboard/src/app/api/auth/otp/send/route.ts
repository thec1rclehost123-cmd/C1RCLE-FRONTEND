import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/**
 * Real proxy to the V2 gateway's `POST /api/v2/auth/otp/send` — replaces
 * the fixture that always returned `Dummy Code: 123456`. Pre-session, like
 * `login`/`signup`: no cookie to re-scope, no CSRF token to mint (nothing
 * yet exists to protect). The gateway itself returns the same generic ack
 * regardless of outcome (its own anti-enumeration design), so there is
 * nothing this proxy needs to normalize on top of that.
 */
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

  const gatewayResponse = await forwardToGateway('/api/v2/auth/otp/send', {
    method: 'POST',
    body,
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

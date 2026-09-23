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
 * BFF: `POST /api/rsvp` → gateway `POST /api/v2/rsvp` (direct free-ticket
 * booking, no payment provider). Same-origin + double-submit CSRF guarded
 * like every other state-changing BFF route; the browser's httpOnly session
 * cookie is forwarded server-side so no bearer token is involved. A fresh
 * `Idempotency-Key` is minted per call — client retries of the same browser
 * request replay safely, and the gateway's deterministic RSVP id keeps
 * double-taps to one ticket.
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

  const gatewayResponse = await forwardToGateway('/api/v2/rsvp', {
    method: 'POST',
    body,
    cookie: req.headers.get('cookie'),
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 201 });
}

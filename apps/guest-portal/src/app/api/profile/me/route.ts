import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/**
 * BFF: `GET /api/profile/me` → gateway `GET /api/v2/profile/me` (caller-scoped
 * guest profile). Same-origin guarded; read-only so no CSRF double-submit. The
 * browser's httpOnly session cookie is forwarded server-side.
 *
 * A `404` is a *success* case here, not an error: the gateway 404s until the
 * guest saves a profile for the first time. It is passed through unchanged so
 * the client can tell "no profile yet" (`not_found`) apart from a real failure
 * and fall back to the session identity rather than inventing one.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const gatewayResponse = await forwardToGateway('/api/v2/profile/me', {
    method: 'GET',
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    if (gatewayResponse.status === 401) {
      return errorEnvelope('unauthorized', 'Not authenticated.', 401);
    }
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

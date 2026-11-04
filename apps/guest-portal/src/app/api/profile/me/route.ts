import { NextResponse } from 'next/server';

import { upsertGuestProfileSchema } from '@c1rcle/contracts';

import {
  SESSION_COOKIE_NAME,
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayUnreachable,
  parseJson,
  passThroughGatewayError,
  stripProtoKeys,
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

/** Same-origin, session- and CSRF-protected full-replace Guest profile write. */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(request);
  if (originError !== null) return originError;

  const sessionToken =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ??
    request.cookies.get(`__Secure-${SESSION_COOKIE_NAME}`)?.value;
  if (!sessionToken) {
    return errorEnvelope('unauthorized', 'Authentication required to update your profile.', 401);
  }

  const csrfError = assertCsrf(request);
  if (csrfError !== null) return csrfError;

  let rawBody: unknown;
  try {
    rawBody = stripProtoKeys(await request.json());
  } catch {
    return errorEnvelope('validation', 'Profile details must be valid JSON.', 400);
  }
  const parsed = upsertGuestProfileSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorEnvelope('validation', 'Profile details are invalid.', 422);
  }

  let gatewayResponse: Response;
  try {
    gatewayResponse = await forwardToGateway('/api/v2/profile/me', {
      method: 'PUT',
      body: parsed.data,
      cookie: request.headers.get('cookie'),
    });
  } catch {
    return gatewayUnreachable();
  }

  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  try {
    return NextResponse.json(parseJson(bodyText), { status: gatewayResponse.status });
  } catch {
    return gatewayUnreachable();
  }
}

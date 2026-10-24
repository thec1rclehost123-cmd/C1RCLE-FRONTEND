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

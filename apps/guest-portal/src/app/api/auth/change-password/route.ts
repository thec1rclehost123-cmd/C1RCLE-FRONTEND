import { NextResponse } from 'next/server';

import { changePasswordSchema } from '@c1rcle/contracts';

import {
  SESSION_COOKIE_NAME,
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayUnreachable,
  parseJson,
  passThroughGatewayError,
  rescopeSessionCookies,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const sessionToken =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ??
    req.cookies.get(`__Secure-${SESSION_COOKIE_NAME}`)?.value;
  if (!sessionToken) return errorEnvelope('unauthorized', 'Sign in to change your password.', 401);

  const csrfError = assertCsrf(req);
  if (csrfError) return csrfError;

  let body: unknown;
  try {
    body = stripProtoKeys(await req.json());
  } catch {
    return errorEnvelope('validation', 'Request body must be valid JSON.', 400);
  }
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return errorEnvelope('validation', 'Password details are invalid.', 422);

  let gatewayResponse: Response;
  try {
    gatewayResponse = await forwardToGateway('/api/v2/auth/change-password', {
      method: 'POST',
      body: parsed.data,
      cookie: req.headers.get('cookie'),
    });
  } catch {
    return gatewayUnreachable();
  }

  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    return passThroughGatewayError(
      gatewayResponse.status,
      bodyText,
      gatewayResponse.headers.get('retry-after'),
    );
  }

  const payload = parseJson(bodyText);
  if (payload === undefined) return gatewayUnreachable();
  const res = NextResponse.json(payload, { status: 200 });
  rescopeSessionCookies(gatewayResponse, res);
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}

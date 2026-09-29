import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayAuthInit,
  ifMatchHeader,
  parseJson,
  passThroughGatewayError,
  rescopeSessionCookies,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface RouteParams {
  readonly params: Promise<{ readonly id: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
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

  const { id } = await ctx.params;
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const gatewayResponse = await forwardToGateway(`/api/v2/onboarding/applications/${id}`, {
    method: 'PATCH',
    body,
    cookie,
    headers: {
      ...authHeaders,
      ...ifMatchHeader(req),
    },
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  const res = NextResponse.json(parseJson(bodyText), { status: 200 });
  rescopeSessionCookies(gatewayResponse, res);
  return res;
}

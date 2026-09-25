import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  forwardToGateway,
  gatewayAuthInit,
  ifMatchHeader,
  parseJson,
  passThroughGatewayError,
  rescopeSessionCookies,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface RouteParams {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }
  const csrfError = assertCsrf(req);
  if (csrfError !== null) {
    return csrfError;
  }

  const { id } = await ctx.params;
  const idempotencyKey = req.headers.get('idempotency-key') ?? undefined;
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const gatewayResponse = await forwardToGateway(`/api/v2/onboarding/applications/${id}/submit`, {
    method: 'POST',
    cookie,
    headers: {
      ...authHeaders,
      ...(idempotencyKey !== undefined ? { 'Idempotency-Key': idempotencyKey } : {}),
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

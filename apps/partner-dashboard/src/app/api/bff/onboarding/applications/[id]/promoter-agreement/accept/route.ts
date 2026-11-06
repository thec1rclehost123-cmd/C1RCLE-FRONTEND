import { NextResponse } from 'next/server';

import { promoterAgreementAcceptanceRequestSchema } from '@c1rcle/contracts/client';

import {
  assertCsrf,
  assertPathId,
  assertSameOrigin,
  forwardToGateway,
  gatewayAuthInit,
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
  const idError = assertPathId(id);
  if (idError !== null) {
    return idError;
  }
  const parsed = promoterAgreementAcceptanceRequestSchema
    .omit({ requestId: true })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid agreement version' }, { status: 400 });
  const idempotencyKey = req.headers.get('idempotency-key') ?? undefined;
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const gatewayResponse = await forwardToGateway(
    `/api/v2/onboarding/applications/${id}/promoter-agreement/accept`,
    {
      method: 'POST',
      body: parsed.data,
      cookie,
      headers: {
        ...authHeaders,
        ...(idempotencyKey !== undefined ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
    },
  );
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  const res = NextResponse.json(parseJson(bodyText), {
    status: 200,
    headers: { 'cache-control': 'private, no-store' },
  });
  rescopeSessionCookies(gatewayResponse, res);
  return res;
}

import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/** Buyer-scoped order projection used to add booking/refund truth to the wallet. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;

  const requested = Number(req.nextUrl.searchParams.get('limit') ?? '50');
  const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 100) : 50;
  const gatewayResponse = await forwardToGateway(`/api/v2/wallet/orders?limit=${String(limit)}`, {
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

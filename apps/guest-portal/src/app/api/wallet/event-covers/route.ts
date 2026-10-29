import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/** Caller-scoped event-cover balances and history; no store is authoritative here. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;

  const gatewayResponse = await forwardToGateway('/api/v2/wallet/event-covers', {
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

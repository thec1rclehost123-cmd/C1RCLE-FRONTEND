import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;

  const requested = Number(req.nextUrl.searchParams.get('limit') ?? '20');
  const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 100) : 20;
  const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';
  const gatewayResponse = await forwardToGateway(
    `/api/v2/notifications/me?limit=${String(limit)}&unreadOnly=${String(unreadOnly)}`,
    { method: 'GET', cookie: req.headers.get('cookie') },
  );
  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    if (gatewayResponse.status === 401)
      return errorEnvelope('unauthorized', 'Sign in to view your notifications.', 401);
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }
  return NextResponse.json(parseJson(bodyText), {
    status: 200,
    headers: { 'cache-control': 'private, no-store' },
  });
}

import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';
import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const gatewayResponse = await forwardToGateway('/api/v2/waitlist?limit=100', {
    method: 'GET',
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();
  if (!gatewayResponse.ok) {
    if (gatewayResponse.status === 401)
      return errorEnvelope('unauthorized', 'Sign in to view your waitlist.', 401);
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }
  return NextResponse.json(parseJson(bodyText), {
    status: 200,
    headers: { 'cache-control': 'private, no-store' },
  });
}

export function POST(req: NextRequest): Promise<NextResponse> {
  return proxyGatewayWrite(req, {
    gatewayPath: '/api/v2/waitlist',
    successStatus: 201,
    unauthenticatedMessage: 'Sign in with a verified account to join this waitlist.',
    idempotent: true,
  });
}

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

interface Params {
  params: Promise<{ challengeId: string }>;
}

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const { challengeId } = await params;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(challengeId)) {
    return errorEnvelope('invalid_request', 'Invalid confirmation link.', 400);
  }
  const response = await forwardToGateway(
    `/api/v2/wallet/event-cover-redemption-challenges/${encodeURIComponent(challengeId)}`,
    { method: 'GET', cookie: req.headers.get('cookie') },
  );
  const body = await response.text();
  if (!response.ok) {
    if (response.status === 401) return errorEnvelope('unauthorized', 'Not authenticated.', 401);
    return passThroughGatewayError(response.status, body);
  }
  return NextResponse.json(parseJson(body), { status: 200 });
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const { challengeId } = await params;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(challengeId)) {
    return errorEnvelope('invalid_request', 'Invalid confirmation link.', 400);
  }
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/wallet/event-cover-redemption-challenges/${encodeURIComponent(challengeId)}/confirm`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to confirm this event cover purchase.',
    idempotent: true,
  });
}

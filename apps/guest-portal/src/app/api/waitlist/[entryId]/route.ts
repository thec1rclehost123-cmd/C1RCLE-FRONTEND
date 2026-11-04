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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ entryId: string }> },
): Promise<NextResponse> {
  const { entryId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(entryId)) {
    return NextResponse.json(
      { code: 'not_found', message: 'Waitlist entry unavailable.', status: 404 },
      { status: 404 },
    );
  }
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const response = await forwardToGateway(`/api/v2/waitlist/${encodeURIComponent(entryId)}`, {
    method: 'GET',
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    if (response.status === 401)
      return errorEnvelope('unauthorized', 'Sign in to access this offer.', 401);
    return passThroughGatewayError(response.status, bodyText);
  }
  return NextResponse.json(parseJson(bodyText), {
    status: 200,
    headers: { 'cache-control': 'private, no-store' },
  });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ entryId: string }> },
): Promise<NextResponse> {
  const { entryId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(entryId)) {
    return NextResponse.json(
      { code: 'not_found', message: 'Waitlist entry unavailable.', status: 404 },
      { status: 404 },
    );
  }
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/waitlist/${encodeURIComponent(entryId)}/cancel`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to leave this waitlist.',
    idempotent: true,
  });
}

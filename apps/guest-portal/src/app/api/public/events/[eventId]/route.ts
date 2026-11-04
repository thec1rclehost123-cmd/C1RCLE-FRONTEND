import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const { eventId } = await context.params;
  const grantId = request.headers.get('x-ticket-access-grant-id');
  if (!grantId || !/^[A-Za-z0-9_-]{1,64}$/.test(grantId)) {
    return errorEnvelope('validation', 'An access grant is required.', 400);
  }
  const response = await forwardToGateway(`/api/v2/public/events/${encodeURIComponent(eventId)}`, {
    method: 'GET',
    cookie: request.headers.get('cookie'),
    headers: { 'x-ticket-access-grant-id': grantId },
  });
  const body = await response.text();
  if (!response.ok) return passThroughGatewayError(response.status, body);
  return NextResponse.json(parseJson(body), {
    status: 200,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

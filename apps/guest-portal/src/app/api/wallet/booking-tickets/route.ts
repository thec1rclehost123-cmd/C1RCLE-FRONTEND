import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const query = new URLSearchParams({ limit: '100' });
  const cursor = req.nextUrl.searchParams.get('cursor');
  if (cursor) query.set('cursor', cursor);
  const response = await forwardToGateway(`/api/v2/wallet/booking-tickets?${query.toString()}`, {
    method: 'GET',
    cookie: req.headers.get('cookie'),
  });
  const body = await response.text();
  if (!response.ok) return passThroughGatewayError(response.status, body);
  return NextResponse.json(parseJson(body), { headers: { 'Cache-Control': 'private, no-store' } });
}

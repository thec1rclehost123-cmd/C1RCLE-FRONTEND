import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest, context: { params: Promise<{ ticketId: string }> }) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { ticketId: id } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(id))
    return errorEnvelope('not_found', 'Ticket unavailable.', 404);
  const response = await forwardToGateway(`/api/v2/tickets/${encodeURIComponent(id)}/management`, {
    method: 'GET',
    cookie: req.headers.get('cookie'),
  });
  const body = await response.text();
  if (!response.ok) return passThroughGatewayError(response.status, body);
  return NextResponse.json(parseJson(body), { headers: { 'Cache-Control': 'private, no-store' } });
}

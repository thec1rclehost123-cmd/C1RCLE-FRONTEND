import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface OrderRouteContext {
  params: Promise<{ id: string }>;
}

/**
 * BFF: `GET /api/orders/:id` → gateway `GET /api/v2/orders/:id` (buyer-only;
 * strangers get the gateway's 404, never the order). Same-origin guarded;
 * read-only so no CSRF double-submit. Lets the confirmation page render a
 * real fulfilled order server-side with the browser's httpOnly session.
 */
export async function GET(req: NextRequest, context: OrderRouteContext): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  const { id } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id) || id.length > 64) {
    return errorEnvelope('validation', 'Unknown confirmation.', 404);
  }

  const gatewayResponse = await forwardToGateway(`/api/v2/orders/${id}`, {
    method: 'GET',
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

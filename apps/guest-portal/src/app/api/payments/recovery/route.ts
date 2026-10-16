import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';
import { PAYMENT_RECOVERY_COOKIE } from '@/lib/bff/payment-recovery';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const holdId = req.cookies.get(PAYMENT_RECOVERY_COOKIE)?.value;
  if (!holdId || !/^[A-Za-z0-9_-]{3,128}$/.test(holdId)) {
    return errorEnvelope('not_found', 'No payment is awaiting recovery.', 404);
  }

  const gateway = await forwardToGateway(
    `/api/v2/payments/attempts/${encodeURIComponent(holdId)}/status`,
    { method: 'GET', cookie: req.headers.get('cookie') },
  );
  const bodyText = await gateway.text();
  if (!gateway.ok) return passThroughGatewayError(gateway.status, bodyText);
  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

export function DELETE(req: NextRequest): NextResponse {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const response = NextResponse.json({ cleared: true }, { status: 200 });
  response.cookies.set(PAYMENT_RECOVERY_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 0,
  });
  return response;
}

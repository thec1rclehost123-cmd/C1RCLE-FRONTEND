import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayUnreachable,
  passThroughGatewayError,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/**
 * Completes a reset with the emailed one-time token (body only, never logged
 * or echoed). Gateway errors, including an invalid/expired token, pass
 * through as the flat envelope.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }

  let body: unknown;
  try {
    body = stripProtoKeys(await req.json());
  } catch {
    return errorEnvelope('validation', 'Request body must be valid JSON.', 400);
  }

  let gatewayResponse: Response;
  try {
    gatewayResponse = await forwardToGateway('/api/v2/auth/reset-password', {
      method: 'POST',
      body,
    });
  } catch {
    return gatewayUnreachable();
  }

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(
      gatewayResponse.status,
      await gatewayResponse.text(),
      gatewayResponse.headers.get('retry-after'),
    );
  }

  return NextResponse.json({ status: true }, { status: 200 });
}

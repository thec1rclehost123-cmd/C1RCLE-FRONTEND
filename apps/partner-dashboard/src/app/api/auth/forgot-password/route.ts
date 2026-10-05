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

/** Constant ack: identical for registered and unregistered addresses. */
const GENERIC_ACK = {
  status: true,
  message: 'If an account exists for that email, a reset link has been sent.',
} as const;

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
    gatewayResponse = await forwardToGateway('/api/v2/auth/forgot-password', {
      method: 'POST',
      body,
    });
  } catch {
    return gatewayUnreachable();
  }

  if (!gatewayResponse.ok) {
    // Only request-shape (400/422) and throttling (429) errors are
    // independent of account existence, so only those keep their detail.
    const status = gatewayResponse.status;
    if (status === 400 || status === 422 || status === 429) {
      return passThroughGatewayError(
        status,
        await gatewayResponse.text(),
        gatewayResponse.headers.get('retry-after'),
      );
    }
    return gatewayUnreachable();
  }

  return NextResponse.json(GENERIC_ACK, { status: 200 });
}

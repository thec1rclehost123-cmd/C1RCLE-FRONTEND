import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayUnreachable,
  mintCsrfToken,
  parseJson,
  passThroughGatewayError,
  rescopeSessionCookies,
  setCsrfCookie,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

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
    gatewayResponse = await forwardToGateway('/api/v2/auth/login', { method: 'POST', body });
  } catch {
    return gatewayUnreachable();
  }
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    // The gateway already collapses every login 4xx to one generic message
    // (account-existence oracle suppression), so pass it straight through.
    return passThroughGatewayError(
      gatewayResponse.status,
      bodyText,
      gatewayResponse.headers.get('retry-after'),
    );
  }

  const payload = parseJson(bodyText);
  if (payload === undefined) {
    return gatewayUnreachable();
  }
  const res = NextResponse.json(payload, { status: 200 });
  rescopeSessionCookies(gatewayResponse, res);
  setCsrfCookie(res, mintCsrfToken());
  return res;
}

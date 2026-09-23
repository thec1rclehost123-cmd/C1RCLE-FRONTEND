import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  forwardToGateway,
  gatewayAuthInit,
  mintIdempotencyKey,
  parseJson,
  passThroughGatewayError,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

interface RouteParams {
  readonly params: Promise<{ readonly id: string; readonly notificationId: string }>;
}

export async function POST(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }
  const csrfError = assertCsrf(req);
  if (csrfError !== null) {
    return csrfError;
  }

  const { id, notificationId } = await ctx.params;
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  // The decision (`approve` | `reject`) is the only payload the gateway
  // accepts; a malformed body will fail its `notificationActionRequestSchema`
  // and surface as a 422 pass-through. Proto-key pollution is scrubbed before
  // relay, mirroring the other write BFFs.
  const body = stripProtoKeys(JSON.parse(await req.text()) as unknown);
  const gatewayResponse = await forwardToGateway(
    `/api/v2/organizations/${id}/notifications/${notificationId}/actions`,
    {
      method: 'POST',
      body,
      cookie,
      headers: {
        ...authHeaders,
        ...mintIdempotencyHeader(),
        // The gateway scopes the inbox to the requested org.
        'x-organization-id': id,
      },
    },
  );
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 200 });
}

/**
 * Quick actions are state-changing commands, so the gateway validates and
 * dedups on `idempotency-key`. The key is minted inside the BFF so the
 * browser never owns that contract; a double-submit of the same decision
 * re-runs against an already-pending/active row, which the resource service
 * answers with the same outcome.
 */
function mintIdempotencyHeader(): Record<string, string> {
  return { 'Idempotency-Key': mintIdempotencyKey() };
}

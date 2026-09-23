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
} from '@/lib/bff/auth-proxy';

interface RouteParams {
  readonly params: Promise<{ readonly id: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }
  const csrfError = assertCsrf(req);
  if (csrfError !== null) {
    return csrfError;
  }

  const { id } = await ctx.params;
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const gatewayResponse = await forwardToGateway(
    `/api/v2/organizations/${id}/notifications/read-all`,
    {
      method: 'PATCH',
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
 * The gateway treats `read-all` as a command (it validates `idempotency-key`)
 * even though the write itself is idempotent. Minting a fresh key here keeps
 * the browser out of that contract; re-running the PATCH re-marks the
 * currently-unread rows, which never double-counts already-read ones.
 */
function mintIdempotencyHeader(): Record<string, string> {
  return { 'Idempotency-Key': mintIdempotencyKey() };
}

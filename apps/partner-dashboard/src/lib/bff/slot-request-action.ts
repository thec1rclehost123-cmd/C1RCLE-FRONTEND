import { NextResponse } from 'next/server';

import { assertCsrf, assertSameOrigin, gatewayAuthInit } from './auth-proxy';
import {
  GatewayError,
  acceptSlotRequest,
  cancelSlotRequest,
  rejectSlotRequest,
} from './slot-request-gateway';

import type { NextRequest } from 'next/server';

/** The host- or venue-owner decision that routes under `/slot-requests/:id/*`. */
export type SlotRequestActionKind = 'accept' | 'reject' | 'cancel';

const actions = {
  accept: acceptSlotRequest,
  reject: rejectSlotRequest,
  cancel: cancelSlotRequest,
} as const;

/**
 * Applies a host/venue decision to a slot request. The single authenticated
 * caller is the browser session cookie forwarded via the BFF; org identity for
 * the gateway comes from the `organizationId` query (the active-org cookie the
 * client already resolves). Errors are passed through in the gateway's own
 * envelope so the UI can map `404 not_found` / `409 conflict` precisely.
 */
export async function applySlotRequestAction(
  req: NextRequest,
  slotRequestId: string,
  action: SlotRequestActionKind,
): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const csrfError = assertCsrf(req);
  if (csrfError !== null) return csrfError;

  const organizationId = req.nextUrl.searchParams.get('organizationId');
  if (!organizationId || organizationId.length === 0) {
    return NextResponse.json(
      { code: 'validation', message: 'A valid `organizationId` query is required.', status: 400 },
      { status: 400 },
    );
  }

  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  try {
    const dto = await actions[action](slotRequestId, organizationId, {
      cookie,
      headers: authHeaders ?? {},
    });
    return NextResponse.json(dto, { status: 200 });
  } catch (error) {
    if (error instanceof GatewayError) {
      const envelope =
        typeof error.envelope === 'object' && error.envelope !== null
          ? error.envelope
          : { code: 'server', message: error.message, status: error.status };
      return NextResponse.json(envelope, { status: error.status });
    }
    return NextResponse.json(
      { code: 'server', message: 'Slot-request action failed.', status: 500 },
      { status: 500 },
    );
  }
}
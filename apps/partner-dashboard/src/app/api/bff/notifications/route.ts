import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  errorEnvelope,
  gatewayAuthInit,
} from '@/lib/bff/auth-proxy';
import {
  GatewayError,
  loadSlotRequestNotifications,
} from '@/lib/bff/slot-request-gateway';

import type { SlotRequestDirection } from '@/data/partner-data-source';
import type { NextRequest } from 'next/server';

function toDirection(value: string | null | undefined): SlotRequestDirection | null {
  return value === 'incoming' || value === 'outgoing' ? value : null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;

  const direction = toDirection(req.nextUrl.searchParams.get('direction'));
  const organizationId = req.nextUrl.searchParams.get('organizationId');
  if (direction === null) {
    return errorEnvelope('validation', 'A valid `direction` query is required.', 400);
  }
  if (!organizationId || organizationId.length === 0) {
    return errorEnvelope('validation', 'A valid `organizationId` query is required.', 400);
  }

  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  try {
    const notifications = await loadSlotRequestNotifications(direction, organizationId, {
      cookie,
      headers: authHeaders ?? {},
    });
    return NextResponse.json({ dataStatus: 'live', notifications }, { status: 200 });
  } catch (error) {
    if (error instanceof GatewayError) {
      const envelope =
        typeof error.envelope === 'object' && error.envelope !== null
          ? error.envelope
          : { code: 'server', message: error.message, status: error.status };
      return NextResponse.json(envelope, { status: error.status });
    }
    return errorEnvelope('server', 'Notification service is unavailable.', 500);
  }
}
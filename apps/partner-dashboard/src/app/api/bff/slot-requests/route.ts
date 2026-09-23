import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  gatewayAuthInit,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';
import {
  GatewayError,
  loadSlotRequestsData,
  submitHostSlotRequest,
} from '@/lib/bff/slot-request-gateway';

import type { SlotRequestDirection } from '@/data/partner-data-source';
import type { HostSlotRequestSubmitInput } from '@/lib/bff/slot-request-gateway';
import type { NextRequest } from 'next/server';

function toDirection(value: string | null | undefined): SlotRequestDirection | null {
  return value === 'incoming' || value === 'outgoing' ? value : null;
}

function routeError(error: unknown): NextResponse {
  if (error instanceof GatewayError) {
    const envelope =
      typeof error.envelope === 'object' && error.envelope !== null
        ? error.envelope
        : { code: 'server', message: error.message, status: error.status };
    return NextResponse.json(envelope, { status: error.status });
  }
  return errorEnvelope('server', 'Slot-request service is unavailable.', 500);
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
    const data = await loadSlotRequestsData(direction, organizationId, {
      cookie,
      headers: authHeaders ?? {},
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const csrfError = assertCsrf(req);
  if (csrfError !== null) return csrfError;

  let body: unknown;
  try {
    body = stripProtoKeys(await req.json());
  } catch {
    return errorEnvelope('validation', 'Request body must be valid JSON.', 400);
  }
  const draft = (body as { draft?: unknown }).draft as HostSlotRequestSubmitInput | undefined;
  if (!draft || typeof draft.organizationId !== 'string' || !draft.organizationId || typeof draft.venueId !== 'string' || !draft.venueId || typeof draft.name !== 'string' || !draft.name.trim() || typeof draft.date !== 'string' || typeof draft.time !== 'string') {
    return errorEnvelope('validation', 'A complete host event draft is required.', 400);
  }

  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  try {
    const result = await submitHostSlotRequest(draft, { cookie, headers: authHeaders ?? {} });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
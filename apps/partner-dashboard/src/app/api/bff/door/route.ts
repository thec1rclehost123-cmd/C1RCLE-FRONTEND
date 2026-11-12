import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  confirmCoupleBodySchema,
  eventCodeCreateBodySchema,
  eventCodeDtoSchema,
  eventCodeListResponseSchema,
  opaqueIdSchema,
  revokeReasonBodySchema,
  scanRequestSchema,
  scanResponseSchema,
  scannerSessionCreateBodySchema,
  startShiftResponseSchema,
  ticketLookupResponseSchema,
  ticketAddonRedemptionRequestSchema,
  ticketAddonRedemptionResponseSchema,
} from '@c1rcle/contracts';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayAuthInit,
  parseJson,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

const requestSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('codesList'),
    organizationId: opaqueIdSchema,
    eventId: opaqueIdSchema,
  }),
  z.object({
    operation: z.literal('codesCreate'),
    organizationId: opaqueIdSchema,
    eventId: opaqueIdSchema,
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
    ...eventCodeCreateBodySchema.shape,
  }),
  z.object({
    operation: z.literal('codeRevoke'),
    organizationId: opaqueIdSchema,
    codeId: opaqueIdSchema,
    ...revokeReasonBodySchema.shape,
  }),
  z.object({
    operation: z.literal('start'),
    organizationId: opaqueIdSchema,
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
    ...scannerSessionCreateBodySchema.shape,
  }),
  z.object({
    operation: z.literal('lookup'),
    organizationId: opaqueIdSchema,
    sessionToken: z.string().min(1),
    ...scanRequestSchema.shape,
  }),
  z.object({
    operation: z.literal('scan'),
    organizationId: opaqueIdSchema,
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
    sessionToken: z.string().min(1),
    ...scanRequestSchema.shape,
  }),
  z.object({
    operation: z.literal('confirm'),
    organizationId: opaqueIdSchema,
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
    sessionToken: z.string().min(1),
    ...confirmCoupleBodySchema.shape,
  }),
  z.object({
    operation: z.literal('redeemAddon'),
    organizationId: opaqueIdSchema,
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
    sessionToken: z.string().min(1),
    ...ticketAddonRedemptionRequestSchema.shape,
  }),
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;
  const csrfError = assertCsrf(req);
  if (csrfError !== null) return csrfError;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorEnvelope('validation', 'A valid scanner request is required.', 400);
  }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return errorEnvelope('validation', 'A valid scanner request is required.', 400);
  }
  const body = parsed.data;
  const { cookie, headers } = gatewayAuthInit(req);
  const route =
    body.operation === 'codesList'
      ? `/api/v2/door/events/${encodeURIComponent(body.eventId)}/door-codes`
      : body.operation === 'codesCreate'
        ? `/api/v2/door/events/${encodeURIComponent(body.eventId)}/door-codes`
        : body.operation === 'codeRevoke'
          ? `/api/v2/door/door-codes/${encodeURIComponent(body.codeId)}/revoke`
          : body.operation === 'start'
            ? '/api/v2/door/sessions'
            : body.operation === 'lookup'
              ? '/api/v2/door/lookup'
              : body.operation === 'scan'
                ? '/api/v2/door/check-ins'
                : body.operation === 'confirm'
                  ? '/api/v2/door/check-ins/confirm'
                  : '/api/v2/door/ticket-addons/redeem';
  const payload = { ...body } as Record<string, unknown>;
  delete payload['operation'];
  delete payload['organizationId'];
  delete payload['sessionToken'];
  delete payload['idempotencyKey'];
  if (body.operation === 'codesList' || body.operation === 'codesCreate') delete payload['eventId'];
  if (body.operation === 'codeRevoke') delete payload['codeId'];
  const response = await forwardToGateway(route, {
    method: body.operation === 'codesList' ? 'GET' : 'POST',
    ...(body.operation === 'codesList' ? {} : { body: payload }),
    cookie,
    headers: {
      ...headers,
      'x-organization-id': body.organizationId,
      ...('sessionToken' in body ? { 'x-scanner-session-token': body.sessionToken } : {}),
      ...('idempotencyKey' in body ? { 'idempotency-key': body.idempotencyKey } : {}),
    },
  }).catch(() => null);

  if (response === null) return errorEnvelope('server', 'The scanner service is unavailable.', 502);
  const responseText = await response.text();
  if (!response.ok)
    return passThroughGatewayError(
      response.status,
      responseText,
      response.headers.get('retry-after'),
    );

  const schema =
    body.operation === 'codesList'
      ? eventCodeListResponseSchema
      : body.operation === 'codesCreate'
        ? eventCodeDtoSchema
        : body.operation === 'codeRevoke'
          ? eventCodeDtoSchema
          : body.operation === 'start'
            ? startShiftResponseSchema
            : body.operation === 'lookup'
              ? ticketLookupResponseSchema
              : body.operation === 'redeemAddon'
                ? ticketAddonRedemptionResponseSchema
                : scanResponseSchema;
  try {
    const result = schema.safeParse(parseJson(responseText));
    if (!result.success) return errorEnvelope('server', 'The scanner response was invalid.', 502);
    return NextResponse.json(result.data, {
      status: response.status,
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch {
    return errorEnvelope('server', 'The scanner response was invalid.', 502);
  }
}

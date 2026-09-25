import { NextResponse } from 'next/server';

import {
  documentUploadUrlDtoSchema,
  onboardingDocumentLabelSchema,
} from '@c1rcle/contracts';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayAuthInit,
  ifMatchHeader,
  mintIdempotencyKey,
  parseJson,
  passThroughGatewayError,
  putToStorage,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface RouteParams {
  readonly params: Promise<{ readonly id: string }>;
}

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_DOC_BYTES = 5 * 1024 * 1024;
const UPLOAD_URL_PATH = '/api/v2/onboarding/applications';

/**
 * Absorbs the whole KYC document upload on the server so the browser never
 * performs a cross-origin PUT. Flow: buffer the request body → ask the gateway
 * for a pre-signed upload URL → PUT the bytes server-side → confirm the
 * `storagePath` with the gateway. The gateway owns both authz and the signed
 * URL; the BFF only moves bytes.
 *
 * The gateway's confirm step (`POST .../documents`) REQUIRES an
 * `Idempotency-Key` header so a repeated confirmation — from the client's own
 * retry, or a BFF/network retry — dedups into the already-recorded document
 * instead of creating a duplicate record. The client supplies one per upload
 * operation (stable across its internal retries); the BFF generates a fresh
 * one only when the caller sent none. The generated key is a UUID (matches the
 * gateway's `^[A-Za-z0-9_-]+$` format, ≤ 128 chars).
 */
export async function POST(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }
  const csrfError = assertCsrf(req);
  if (csrfError !== null) {
    return csrfError;
  }

  const { id } = await ctx.params;
  const label = onboardingDocumentLabelSchema.safeParse(req.nextUrl.searchParams.get('label'));
  if (!label.success) {
    return errorEnvelope('validation', 'A valid document label is required.', 400);
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return errorEnvelope('validation', 'Unsupported document content type.', 415);
  }

  const declaredLength = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_DOC_BYTES) {
    return errorEnvelope('validation', 'The file must be 5 MB or smaller.', 413);
  }

  const bytes = await req.arrayBuffer();
  if (bytes.byteLength > MAX_DOC_BYTES) {
    return errorEnvelope('validation', 'The file must be 5 MB or smaller.', 413);
  }

  const idempotencyKey = req.headers.get('idempotency-key') ?? mintIdempotencyKey();
  const { cookie, headers: authHeaders } = gatewayAuthInit(req);
  const forwardedHeaders = {
    ...authHeaders,
    'Idempotency-Key': idempotencyKey,
    ...ifMatchHeader(req),
  };

  const uploadUrlResponse = await forwardToGateway(
    `${UPLOAD_URL_PATH}/${id}/documents/upload-url`,
    {
      method: 'POST',
      body: { label: label.data, contentType },
      cookie,
      headers: forwardedHeaders,
    },
  );
  const uploadUrlText = await uploadUrlResponse.text();
  if (!uploadUrlResponse.ok) {
    return passThroughGatewayError(uploadUrlResponse.status, uploadUrlText);
  }

  const upload = documentUploadUrlDtoSchema.parse(parseJson(uploadUrlText));
  const stored = await putToStorage(upload.uploadUrl, upload.headers, bytes);
  if (!stored) {
    return errorEnvelope('server', 'Upload to object storage failed.', 502);
  }

  const confirmResponse = await forwardToGateway(
    `${UPLOAD_URL_PATH}/${id}/documents`,
    {
      method: 'POST',
      body: { label: label.data, storagePath: upload.storagePath },
      cookie,
      headers: forwardedHeaders,
    },
  );
  const confirmText = await confirmResponse.text();
  if (!confirmResponse.ok) {
    return passThroughGatewayError(confirmResponse.status, confirmText);
  }

  return NextResponse.json(parseJson(confirmText), { status: 200 });
}
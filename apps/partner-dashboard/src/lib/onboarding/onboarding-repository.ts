import { z } from 'zod';

/*
 * `documentUploadUrl*` / `verif*Document*` are generated onto `@c1rcle/contracts/client` but
 * missed the curated `@c1rcle/contracts` index — imported from `/client` here rather than editing
 * either generated file.
 */
import { isApiClientError } from '@c1rcle/api-client';
import {
  onboardingRequestDtoSchema,
  startOnboardingSchema,
  verificationResultDtoSchema,
} from '@c1rcle/contracts/client';

import { apiClient } from '@/lib/api/client';
import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/onboarding/csrf';

import type {
  OnboardingDocumentLabel,
  OnboardingRequestDto,
  SaveOnboardingProgressRequest,
  StartOnboardingRequest,
  VerificationResultDto,
  VerifyDocumentRequest,
} from '@c1rcle/contracts/client';

const onboardingMeResponseSchema = z.object({
  request: onboardingRequestDtoSchema.nullable(),
});

/**
 * Optimistic-locking version per application, keyed by request id. Every write
 * returns the DTO with its freshly bumped `version`; it is cached here and sent
 * as `If-Match` on the next write so the gateway's version check passes. On a
 * `409 conflict` (stale — another write landed in between, e.g. a concurrent
 * document upload or autosave) we re-read the current version via `getMine()`
 * and retry exactly once before surfacing the error. This keeps all onboarding
 * writes (autosave, upload, submit) on the same advancing version without
 * threading prop state through every form component.
 */
const versionByRequestId = new Map<string, number>();

function ifMatchHeader(requestId: string): Record<string, string> | undefined {
  const version = versionByRequestId.get(requestId);
  return version === undefined ? undefined : { 'If-Match': String(version) };
}

function recordVersion(requestId: string, dto: OnboardingRequestDto): void {
  versionByRequestId.set(requestId, dto.version);
}

/**
 * Runs a versioned write with optimistic locking: sends `If-Match` from the
 * last DTO seen for `requestId`, and on a `409 conflict` re-reads the current
 * version and retries once. Idempotency keys are preserved across the retry so
 * the gateway dedups the replayed write.
 */
async function withVersionRecovery(
  requestId: string,
  write: (ifMatch: Record<string, string> | undefined) => Promise<OnboardingRequestDto>,
): Promise<OnboardingRequestDto> {
  try {
    const dto = await write(ifMatchHeader(requestId));
    recordVersion(requestId, dto);
    return dto;
  } catch (error) {
    if (!isApiClientError(error) || error.status !== 409) {
      throw error;
    }

    const current = await getMine();
    if (current !== null && current.id === requestId) {
      recordVersion(requestId, current);
    }

    const dto = await write(ifMatchHeader(requestId));
    recordVersion(requestId, dto);
    return dto;
  }
}

/** The applicant's own application, if any. `null` before they have started. */
export async function getMine(): Promise<OnboardingRequestDto | null> {
  // Read through the same-origin BFF (`/api/bff/onboarding/me`), which
  // forwards the browser's httpOnly session cookie to the gateway — no bearer
  // token involved, unlike the direct-gateway writes below.
  const response = await bffClient.get({
    path: '/api/bff/onboarding/me',
    schema: onboardingMeResponseSchema,
  });
  if (response.request !== null) {
    recordVersion(response.request.id, response.request);
  }
  return response.request;
}

/** Alias of {@link getMine}; kept under the V1 name for shared callers. */
export const getMyOnboardingRequest = getMine;

/** Opens an application. One live application per person — a `409` means one already exists. */
export async function start(
  input: StartOnboardingRequest,
  idempotencyKey: string,
): Promise<OnboardingRequestDto> {
  const application = await apiClient.post({
    path: '/api/v2/onboarding/applications',
    body: startOnboardingSchema.parse(input),
    schema: onboardingRequestDtoSchema,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  recordVersion(application.id, application);
  return application;
}

/** Autosave. Not idempotency-keyed — a last-write-wins draft edit. */
export async function saveProgress(
  requestId: string,
  patch: SaveOnboardingProgressRequest,
): Promise<OnboardingRequestDto> {
  return withVersionRecovery(requestId, (ifMatch) =>
    apiClient.patch({
      path: `/api/v2/onboarding/applications/${requestId}`,
      body: patch,
      schema: onboardingRequestDtoSchema,
      headers: { ...ifMatch },
    }),
  );
}

/**
 * Uploads one KYC image with the file bytes moving end-to-end through the app's
 * own BFF (`/api/bff/onboarding/.../documents/upload?label=`): the browser POSTs
 * the raw bytes same-origin, the BFF absorbs them, asks the gateway for a
 * pre-signed URL, PUTs the bytes to object storage server-side and confirms the
 * `storagePath`. The browser never performs a cross-origin PUT, so the app CSP
 * (`connect-src 'self' …`) is never in play for storage.
 *
 * The confirm step is idempotency-keyed; retries reuse the same key and dedup
 * into the already-recorded document.
 */
export async function uploadDocument(
  requestId: string,
  label: OnboardingDocumentLabel,
  file: File,
  idempotencyKey: string,
): Promise<OnboardingRequestDto> {
  return withVersionRecovery(requestId, (ifMatch) =>
    bffClient.post({
      path: `/api/bff/onboarding/applications/${requestId}/documents/upload`,
      query: { label },
      rawBody: file,
      contentType: file.type,
      schema: onboardingRequestDtoSchema,
      headers: { ...csrfHeaders(), 'Idempotency-Key': idempotencyKey, ...ifMatch },
    }),
  );
}

/** Submits the application for review. Blocked server-side until all 3 documents are present. */
export async function submit(
  requestId: string,
  idempotencyKey: string,
): Promise<OnboardingRequestDto> {
  return withVersionRecovery(requestId, (ifMatch) =>
    apiClient.post({
      path: `/api/v2/onboarding/applications/${requestId}/submit`,
      body: null,
      schema: onboardingRequestDtoSchema,
      headers: { 'Idempotency-Key': idempotencyKey, ...ifMatch },
    }),
  );
}

/**
 * Optional format check on a document's declared identity number — never rendered as "Verified",
 * only as a format-check pass, pending manual review (D-018).
 */
export async function verifyDocument(input: VerifyDocumentRequest): Promise<VerificationResultDto> {
  return apiClient.post({
    path: '/api/v2/onboarding/verify-document',
    body: input,
    schema: verificationResultDtoSchema,
  });
}

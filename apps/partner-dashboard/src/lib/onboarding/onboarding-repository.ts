import { z } from 'zod';

/*
 * `documentUploadUrl*` / `verif*Document*` are generated onto `@c1rcle/contracts/client` but
 * missed the curated `@c1rcle/contracts` index — imported from `/client` here rather than editing
 * either generated file.
 */
import {
  addOnboardingDocumentSchema,
  documentUploadUrlDtoSchema,
  onboardingRequestDtoSchema,
  startOnboardingSchema,
  verificationResultDtoSchema,
} from '@c1rcle/contracts/client';

import { apiClient } from '@/lib/api/client';

import type {
  AddOnboardingDocumentRequest,
  DocumentUploadUrlDto,
  DocumentUploadUrlRequest,
  OnboardingRequestDto,
  SaveOnboardingProgressRequest,
  StartOnboardingRequest,
  VerificationResultDto,
  VerifyDocumentRequest,
} from '@c1rcle/contracts/client';

const onboardingMeResponseSchema = z.object({
  request: onboardingRequestDtoSchema.nullable(),
});

/** The applicant's own application, if any. `null` before they have started. */
export async function getMine(): Promise<OnboardingRequestDto | null> {
  const response = await apiClient.get({
    path: '/api/v2/onboarding/me',
    schema: onboardingMeResponseSchema,
  });
  return response.request;
}

/** Opens an application. One live application per person — a `409` means one already exists. */
export async function start(
  input: StartOnboardingRequest,
  idempotencyKey: string,
): Promise<OnboardingRequestDto> {
  return apiClient.post({
    path: '/api/v2/onboarding/applications',
    body: startOnboardingSchema.parse(input),
    schema: onboardingRequestDtoSchema,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

/** Autosave. Not idempotency-keyed — a last-write-wins draft edit. */
export async function saveProgress(
  requestId: string,
  patch: SaveOnboardingProgressRequest,
): Promise<OnboardingRequestDto> {
  return apiClient.patch({
    path: `/api/v2/onboarding/applications/${requestId}`,
    body: patch,
    schema: onboardingRequestDtoSchema,
  });
}

/** Mints a pre-signed URL for one KYC image. Not idempotency-keyed — the object key is deterministic. */
export async function getUploadUrl(
  requestId: string,
  input: DocumentUploadUrlRequest,
): Promise<DocumentUploadUrlDto> {
  return apiClient.post({
    path: `/api/v2/onboarding/applications/${requestId}/documents/upload-url`,
    body: input,
    schema: documentUploadUrlDtoSchema,
  });
}

/** Records an uploaded document against the application, once the signed PUT has completed. */
export async function addDocument(
  requestId: string,
  input: AddOnboardingDocumentRequest,
  idempotencyKey: string,
): Promise<OnboardingRequestDto> {
  return apiClient.post({
    path: `/api/v2/onboarding/applications/${requestId}/documents`,
    body: addOnboardingDocumentSchema.parse(input),
    schema: onboardingRequestDtoSchema,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

/** Submits the application for review. Blocked server-side until all 3 documents are present. */
export async function submit(
  requestId: string,
  idempotencyKey: string,
): Promise<OnboardingRequestDto> {
  return apiClient.post({
    path: `/api/v2/onboarding/applications/${requestId}/submit`,
    body: null,
    schema: onboardingRequestDtoSchema,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

/**
 * Optional format check on a document's declared identity number — never rendered as "Verified",
 * only as a format-check pass, pending manual review (D-018).
 */
export async function verifyDocument(
  input: VerifyDocumentRequest,
): Promise<VerificationResultDto> {
  return apiClient.post({
    path: '/api/v2/onboarding/verify-document',
    body: input,
    schema: verificationResultDtoSchema,
  });
}

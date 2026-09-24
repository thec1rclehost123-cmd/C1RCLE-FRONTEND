import { z } from 'zod';

import {
  documentUploadUrlDtoSchema,
  onboardingRequestDtoSchema,
  verificationResultDtoSchema,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import type {
  DocumentUploadUrlDto,
  OnboardingDocumentLabel,
  OnboardingProfileDto,
  OnboardingRequestDto,
  SaveOnboardingProgressRequest,
  VerificationResultDto,
} from '@c1rcle/contracts';

const myOnboardingResponseSchema = z.object({
  request: onboardingRequestDtoSchema.nullable(),
});

/**
 * The logged-in user's own onboarding application, or `null` before they
 * have started one. Mirrors `org-repository.ts`'s shape — a thin
 * `apiClient` call, no fixture fallback.
 */
export async function getMyOnboardingRequest(): Promise<OnboardingRequestDto | null> {
  const response = await apiClient.get({
    path: '/api/v2/onboarding/me',
    schema: myOnboardingResponseSchema,
  });
  return response.request;
}

export interface StartOnboardingInput {
  requestedType: 'venue' | 'host' | 'promoter';
  plan: 'basic' | 'silver' | 'diamond';
  profile: OnboardingProfileDto;
}

/** Creates the applicant's onboarding request. One per user (server-enforced). */
export async function startOnboarding(input: StartOnboardingInput): Promise<OnboardingRequestDto> {
  return apiClient.post({
    path: '/api/v2/onboarding/applications',
    body: input,
    schema: onboardingRequestDtoSchema,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
}

/**
 * Autosave. Not idempotency-keyed on the backend (last-write-wins draft
 * edit) — matches here, no key minted.
 */
export async function saveOnboardingProgress(
  requestId: string,
  profile: SaveOnboardingProgressRequest,
): Promise<OnboardingRequestDto> {
  return apiClient.patch({
    path: `/api/v2/onboarding/applications/${requestId}`,
    body: profile,
    schema: onboardingRequestDtoSchema,
  });
}

/** Mints a pre-signed upload URL. The client PUTs the file there directly, then confirms below. */
export async function getDocumentUploadUrl(
  requestId: string,
  label: OnboardingDocumentLabel,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<DocumentUploadUrlDto> {
  return apiClient.post({
    path: `/api/v2/onboarding/applications/${requestId}/documents/upload-url`,
    body: { label, contentType },
    schema: documentUploadUrlDtoSchema,
  });
}

/**
 * Confirms a document after the file was PUT to the pre-signed URL. Pass
 * `storagePath` back verbatim from `getDocumentUploadUrl`'s response.
 */
export async function addOnboardingDocument(
  requestId: string,
  label: OnboardingDocumentLabel,
  storagePath: string,
): Promise<OnboardingRequestDto> {
  return apiClient.post({
    path: `/api/v2/onboarding/applications/${requestId}/documents`,
    body: { label, storagePath },
    schema: onboardingRequestDtoSchema,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
}

/** Submits the application for review. Fails if any required document is still missing. */
export async function submitOnboardingRequest(requestId: string): Promise<OnboardingRequestDto> {
  return apiClient.post({
    path: `/api/v2/onboarding/applications/${requestId}/submit`,
    body: undefined,
    schema: onboardingRequestDtoSchema,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
}

/**
 * Structural document verification (Aadhaar format, phone via GCP Identity
 * Platform's `proofToken`, etc). Never presented as government identity
 * confirmation — `passed` only means the format/provider check passed.
 */
export async function verifyOnboardingDocument(input: {
  documentType: string;
  documentNumber: string;
  holderName?: string;
  proofToken?: string;
}): Promise<VerificationResultDto> {
  return apiClient.post({
    path: '/api/v2/onboarding/verify-document',
    body: input,
    schema: verificationResultDtoSchema,
  });
}

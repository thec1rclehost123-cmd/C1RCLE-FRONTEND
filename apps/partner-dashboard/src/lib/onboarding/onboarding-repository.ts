import { z } from 'zod';

import { onboardingRequestDtoSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import type { OnboardingRequestDto } from '@c1rcle/contracts';

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

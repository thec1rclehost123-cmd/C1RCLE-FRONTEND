import { createApiClient } from '@c1rcle/api-client';
import { noContentSchema } from '@c1rcle/contracts';
import {
  guestOnboardingPatchSchema,
  guestOnboardingStatusSchema,
  guestOnboardingStateSchema,
  guestPhoneProofSchema,
} from '@c1rcle/contracts/guest-onboarding';

import { csrfHeaders } from '@/lib/bff/csrf';

function client() {
  return createApiClient({ baseUrl: window.location.origin });
}
export function readOnboarding() {
  return client().get({ path: '/api/onboarding', schema: guestOnboardingStateSchema });
}
export function readOnboardingStatus() {
  return client().get({ path: '/api/onboarding/status', schema: guestOnboardingStatusSchema });
}
export async function saveOnboarding(patch: unknown) {
  await client().put({
    path: '/api/onboarding',
    body: guestOnboardingPatchSchema.parse(patch),
    headers: csrfHeaders(),
    schema: noContentSchema,
  });
}
export async function verifyOnboardingPhone(phoneNumber: string, proofToken: string) {
  await client().post({
    path: '/api/onboarding/phone',
    body: guestPhoneProofSchema.parse({ phoneNumber, proofToken }),
    headers: csrfHeaders(),
    schema: noContentSchema,
  });
}

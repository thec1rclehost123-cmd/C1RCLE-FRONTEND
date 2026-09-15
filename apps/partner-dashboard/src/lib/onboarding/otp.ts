import { createApiClient } from '@c1rcle/api-client';
import { otpAckResponseSchema, otpSendRequestSchema, otpVerifyRequestSchema } from '@c1rcle/contracts/client';

import { csrfHeaders } from '@/lib/onboarding/csrf';

/**
 * Email verification (`PageClient.tsx`'s `email_verify` step) — routed
 * through the app's own `/api/auth/otp/*` BFF (same `auth-proxy.ts`
 * primitives as `phone-verification`), which forwards to the gateway's
 * session-scoped `EmailOtpService` at `/api/v2/auth/otp/*`. Session-scoped:
 * the BFF requires the `c1rcle.csrf` double-submit token and forwards the
 * browser's httpOnly session cookie — the account must exist first, which
 * the wizard's signup step guarantees before the first send.
 *
 * Phone verification does not go through here: it uses the Firebase Phone
 * Auth SDK directly (`lib/firebase/phone-auth.ts`) and confirms the
 * resulting ID token via `onboarding-repository.ts`'s `verifyDocument`.
 */
const bffClient = createApiClient({
  baseUrl: typeof window === 'undefined' ? '' : window.location.origin,
});

/** Sends a 6-digit one-time code to an email address. */
export async function sendOtp(email: string): Promise<void> {
  await bffClient.post({
    path: '/api/auth/otp/send',
    body: otpSendRequestSchema.parse({ email }),
    schema: otpAckResponseSchema,
    headers: csrfHeaders(),
  });
}

/** Verifies a previously sent one-time code. Throws with the server's message if it's wrong. */
export async function verifyOtp(email: string, code: string): Promise<void> {
  await bffClient.post({
    path: '/api/auth/otp/verify',
    body: otpVerifyRequestSchema.parse({ email, code }),
    schema: otpAckResponseSchema,
    headers: csrfHeaders(),
  });
}

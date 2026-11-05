import { createApiClient } from '@c1rcle/api-client';
import {
  otpAckResponseSchema,
  otpSendRequestSchema,
  otpVerifyRequestSchema,
} from '@c1rcle/contracts';

import { csrfHeaders } from '@/lib/bff/csrf';

function client() {
  return createApiClient({ baseUrl: window.location.origin });
}

export async function sendEmailVerification(email: string): Promise<void> {
  await client().post({
    path: '/api/auth/otp/send',
    body: otpSendRequestSchema.parse({ email }),
    schema: otpAckResponseSchema,
    headers: csrfHeaders(),
  });
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  await client().post({
    path: '/api/auth/otp/verify',
    body: otpVerifyRequestSchema.parse({ email, code }),
    schema: otpAckResponseSchema,
    headers: csrfHeaders(),
  });
}

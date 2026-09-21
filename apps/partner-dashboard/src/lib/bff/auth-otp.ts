/* eslint-disable no-restricted-globals, no-restricted-syntax --
 * Sanctioned same-origin BFF callers for the onboarding wizard's email-OTP and
 * phone-verification steps. These hit this app's own approved Next.js route
 * handlers (`/api/auth/otp/*`, `/api/auth/phone-verification`) — not the
 * gateway — so they cannot go through `@c1rcle/api-client`, which is
 * gateway-scoped (`NEXT_PUBLIC_API_BASE_URL`). This module is the one place
 * these raw calls live, mirroring `src/lib/bff/auth-proxy.ts`. Configuration
 * still comes only from `@c1rcle/config`, never the raw environment.
 */

interface GatewayErrorDetail {
  path?: string;
  message: string;
}

/** Extracts the first readable message from the BFF route's `{ error: { message } }` envelope. */
function extractError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const obj = data as { error?: unknown; message?: unknown };
  const errorObj = obj.error;
  if (errorObj && typeof errorObj === 'object') {
    const err = errorObj as { details?: unknown; message?: unknown };
    if (Array.isArray(err.details) && err.details.length > 0) {
      const detailsMsg = err.details
        .map((d: unknown): string => {
          if (!d || typeof d !== 'object') return '';
          const item = d as Partial<GatewayErrorDetail>;
          const field = item.path ? item.path.replace(/^(body\.|query\.|params\.)/, '') : '';
          return field ? `${field}: ${item.message ?? ''}` : (item.message ?? '');
        })
        .filter((msg) => msg.length > 0)
        .join(', ');
      const msg = typeof err.message === 'string' ? err.message : 'Validation failed';
      return `${msg}: ${detailsMsg}`;
    }
    if (typeof err.message === 'string') return err.message;
  }
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.error === 'string') return obj.error;
  return fallback;
}

/** Sends a 6-digit email code. Strictly pre-session (no auth header required). */
export async function sendOtpEmail(email: string): Promise<void> {
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    throw new Error(extractError(data, 'Failed to send code.'));
  }
}

/** Verifies a 6-digit email code. Pre-session, same as `sendOtpEmail`. */
export async function verifyOtpEmail(email: string, code: string): Promise<void> {
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    throw new Error(extractError(data, 'Incorrect code.'));
  }
}

/**
 * Confirms a phone number against a just-minted Firebase ID token. This one
 * runs post-session — the route requires an existing login, unlike email OTP.
 */
export async function verifyPhoneNumber(input: {
  phoneNumber: string;
  idToken: string;
}): Promise<void> {
  const res = await fetch('/api/auth/phone-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    throw new Error(extractError(data, 'Phone verification failed.'));
  }
}

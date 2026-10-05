import { isApiClientError } from '@c1rcle/api-client';

/**
 * One user-facing sentence for a failed admin call. The gateway's own message
 * is surfaced for 4xx responses (for example the 400 "not every required
 * document is verified" approve gate) because it tells the admin what to do;
 * 5xx/network failures keep the caller's generic fallback.
 */
export function describeAdminError(error: unknown, fallback: string): string {
  if (isApiClientError(error) && error.status !== undefined && error.status < 500) {
    const details = Object.entries(error.fieldErrors ?? {})
      .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
      .slice(0, 3);
    const base = error.message || fallback;
    return details.length ? `${base} (${details.join('; ')})` : base;
  }
  return fallback;
}

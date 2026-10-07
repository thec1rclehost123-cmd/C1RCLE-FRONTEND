import { isApiClientError } from '@c1rcle/api-client';

/**
 * Turn any thrown value into one user-facing sentence. Gateway 422s carry
 * per-field messages (`fieldErrors`) that the generic `message` omits, so they
 * are appended; local contract-parse failures (ZodError) are reduced to their
 * first issue instead of leaking the raw JSON dump.
 */
export function describeApiError(error: unknown, fallback: string): string {
  if (isApiClientError(error)) {
    const details = Object.entries(error.fieldErrors ?? {})
      .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
      .slice(0, 3);
    const base = error.message || fallback;
    return details.length ? `${base} (${details.join('; ')})` : base;
  }
  if (error instanceof Error) {
    const issues = (
      error as { issues?: readonly { path?: readonly unknown[]; message?: string }[] }
    ).issues;
    const first = error.name === 'ZodError' ? issues?.[0] : undefined;
    if (first?.message) {
      const path = first.path?.map(String).join('.');
      return path ? `${path}: ${first.message}` : first.message;
    }
    return error.message || fallback;
  }
  return fallback;
}

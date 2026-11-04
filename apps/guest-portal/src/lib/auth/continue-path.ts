import { safeNextPath } from './safe-next-path';

export function guestDestination(raw: string | null | undefined): string {
  const next = safeNextPath(raw, '/explore');
  return /^\/(auth|onboarding|signup|verify-email|login)(\/|\?|#|$)/.test(next) ? '/explore' : next;
}
export function guestContinuePath(raw: string | null | undefined): string {
  return `/auth/continue?next=${encodeURIComponent(guestDestination(raw))}`;
}

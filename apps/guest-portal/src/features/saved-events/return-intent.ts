import { safeNextPath } from '@/lib/auth/safe-next-path';

/** Protected action boundary lets the existing Guest guard finish setup first. */
export function savedEventReturnPath(slug: string, search = '') {
  return `/profile/saved/return?event=${encodeURIComponent(`/event/${encodeURIComponent(slug)}${search}`)}`;
}
export function trustedSavedEventDestination(raw: unknown) {
  const path = safeNextPath(typeof raw === 'string' ? raw : undefined, '/explore');
  return /^\/event\/[A-Za-z0-9][A-Za-z0-9_-]*$/.test(path.split(/[?#]/, 1)[0] ?? '')
    ? path
    : '/explore';
}

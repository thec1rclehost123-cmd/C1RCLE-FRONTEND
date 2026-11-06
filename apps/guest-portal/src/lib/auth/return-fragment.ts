import { useSessionStore } from '@c1rcle/auth';

const KEY = 'guest.auth.return-fragment';
/** Keep private URL fragments out of auth return query strings and server logs. */
export function captureGuestReturnFragment(path: string): void {
  if (!window.location.hash) return;
  const userId = useSessionStore.getState().session?.user.id ?? null;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ userId, path, fragment: window.location.hash }));
  } catch {
    /* Tab storage may be unavailable. */
  }
}
export function restoreGuestReturnFragment(path: string): string {
  const userId = useSessionStore.getState().session?.user.id ?? null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return path;
    const value = JSON.parse(raw) as { userId?: unknown; path?: unknown; fragment?: unknown };
    if (
      !userId ||
      (value.userId !== null && value.userId !== userId) ||
      value.path !== path ||
      typeof value.fragment !== 'string' ||
      !value.fragment.startsWith('#')
    )
      return path;
    sessionStorage.removeItem(KEY);
    return path + value.fragment;
  } catch {
    return path;
  }
}

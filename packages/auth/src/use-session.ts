import { useSessionStore } from './session-store.js';

import type { Role, Session } from '@c1rcle/types';

export interface UseSessionResult {
  readonly session: Session | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
}

/** Subscribes a component to the current session. */
export function useSession(): UseSessionResult {
  const session = useSessionStore((state) => state.session);
  const status = useSessionStore((state) => state.status);

  return {
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'unknown',
  };
}

/**
 * True when the signed-in user holds one of `roles`.
 *
 * This gates *rendering* only. The backend re-checks every request — a UI
 * that hides a button is a convenience, never a security control.
 */
export function useHasRole(...roles: readonly Role[]): boolean {
  const session = useSessionStore((state) => state.session);
  return session !== null && roles.includes(session.user.role);
}

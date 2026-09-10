import { useSyncExternalStore } from 'react';

import type { User } from '@c1rcle/contracts';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface SessionState {
  readonly session: { user: User } | null;
  readonly accessToken: string | null;
  readonly expiresAt: number | null;
  readonly status: SessionStatus;
  /**
   * Flips true once `SessionProvider`'s bootstrap has resolved once (its
   * initial `refresh()` settled, success or failure). Callers that need a
   * real access token before firing a request should gate on this, NOT on
   * `accessToken !== null` — a token can legitimately go null again later
   * (e.g. a later `refresh()` failing), and that must fall through to the
   * normal request/401/reauth-retry path rather than blocking forever.
   */
  readonly hydrated: boolean;
}

type SessionPatch = Partial<
  Pick<SessionState, 'session' | 'accessToken' | 'expiresAt' | 'status' | 'hydrated'>
>;
type SessionListener = () => void;

const listeners = new Set<SessionListener>();

const notify = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

const updateSession = (patch: SessionPatch) => {
  state = { ...state, ...patch };
  notify();
};

const clearSession = () => {
  updateSession({ accessToken: null, session: null, expiresAt: null, status: 'anonymous' });
};

const markAnonymous = () => {
  clearSession();
};

const setSession = (
  session: { user: User },
  accessToken: string | null,
  expiresAt: number,
) => {
  updateSession({ accessToken, session, expiresAt, status: 'authenticated' });
};

/** Marks the one-time bootstrap as settled; never reverts. See `SessionState.hydrated`. */
const markHydrated = () => {
  updateSession({ hydrated: true });
};

let state: SessionState = {
  accessToken: null,
  expiresAt: null,
  session: null,
  status: 'unknown',
  hydrated: false,
};

const subscribe = (listener: SessionListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getState = () => state;

export const useSessionStore = Object.assign(
  () => useSyncExternalStore(subscribe, getState, getState),
  {
    getState,
    setState: updateSession,
    subscribe,
  },
);

export function useSession() {
  const sessionState = useSessionStore();

  return {
    isAuthenticated: sessionState.status === 'authenticated',
    isLoading: sessionState.status === 'unknown',
    user: sessionState.session?.user ?? null,
  };
}

export function getAccessToken(): string | null {
  return state.accessToken;
}

export { clearSession, markAnonymous, markHydrated, setSession };

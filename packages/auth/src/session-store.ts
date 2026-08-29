import { useSyncExternalStore } from 'react';

import type { User } from '@c1rcle/contracts';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface SessionState {
  readonly session: { user: User } | null;
  readonly accessToken: string | null;
  readonly expiresAt: number | null;
  readonly status: SessionStatus;
}

type SessionPatch = Partial<Pick<SessionState, 'session' | 'accessToken' | 'expiresAt' | 'status'>>;
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

let state: SessionState = {
  accessToken: null,
  expiresAt: null,
  session: null,
  status: 'unknown',
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

export { clearSession, markAnonymous, setSession };

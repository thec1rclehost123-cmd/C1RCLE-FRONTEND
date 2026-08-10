'use client';

import { useSyncExternalStore } from 'react';

export type SessionStatus = 'anonymous' | 'authenticated' | 'unknown';

export interface Session {
  readonly userId?: string;
}

export interface SessionState {
  readonly session: Session | null;
  readonly accessToken: string | null;
  readonly status: SessionStatus;
  readonly clearSession: () => void;
  readonly markAnonymous: () => void;
  readonly setSession: (session: Session, accessToken: string) => void;
}

type SessionPatch = Partial<Pick<SessionState, 'session' | 'accessToken' | 'status'>>;
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
  updateSession({ accessToken: null, session: null, status: 'anonymous' });
};

const markAnonymous = () => {
  clearSession();
};

const setSession = (session: Session, accessToken: string) => {
  updateSession({ accessToken, session, status: 'authenticated' });
};

let state: SessionState = {
  accessToken: null,
  clearSession,
  markAnonymous,
  session: null,
  setSession,
  status: 'anonymous',
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
    session: sessionState.session,
  };
}

export function getAccessToken() {
  return state.accessToken;
}

export { clearSession, markAnonymous, setSession };

// UI-only compatibility export. Real Firebase Auth wiring belongs to backend integration.
export const auth = {
  currentUser: null,
};

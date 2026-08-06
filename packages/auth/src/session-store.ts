import { create } from 'zustand';

import type { Session } from '@c1rcle/types';

/**
 * Client-side session state.
 *
 * This store holds *who is signed in*, not *what they may do*. Authorisation
 * decisions belong to the backend; the frontend uses this only to decide what
 * to render and whether to redirect.
 *
 * The access token deliberately lives in memory only. Persisting it to
 * localStorage would make it readable by any injected script; the durable
 * credential is an httpOnly refresh cookie the backend owns.
 */
interface SessionState {
  readonly session: Session | null;
  readonly accessToken: string | null;
  readonly status: 'unknown' | 'authenticated' | 'anonymous';
  readonly setSession: (session: Session, accessToken: string) => void;
  readonly clearSession: () => void;
  readonly markAnonymous: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  accessToken: null,
  status: 'unknown',

  setSession: (session, accessToken) => {
    set({ session, accessToken, status: 'authenticated' });
  },

  clearSession: () => {
    set({ session: null, accessToken: null, status: 'anonymous' });
  },

  markAnonymous: () => {
    set({ session: null, accessToken: null, status: 'anonymous' });
  },
}));

/**
 * Reads the current token without subscribing.
 *
 * This is the function handed to `@c1rcle/api-client` as its `TokenProvider`,
 * which is why it must not be a hook — the client is not a React component.
 */
export function getAccessToken(): string | null {
  return useSessionStore.getState().accessToken;
}

export function clearSession(): void {
  useSessionStore.getState().clearSession();
}

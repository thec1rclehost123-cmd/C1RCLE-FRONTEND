/**
 * Mock Firebase Auth client for pure UI mode.
 *
 * The dashboard is being built ahead of the real auth backend, so this stands
 * in for `firebase/auth`. It is deliberately session-*ful*: an earlier version
 * returned a bare object with a permanent `currentUser` and no
 * `onAuthStateChanged`, which meant `DashboardAuthProvider` bailed out of its
 * subscription and never set `user` — so signing in appeared to do nothing.
 *
 * The modular `onAuthStateChanged(auth, cb)` / `signInWithEmailAndPassword`
 * helpers delegate to the methods on this object, so implementing them here is
 * enough for the real call sites to work unchanged.
 *
 * Any email + password is accepted. Replace this file with a real
 * `initializeApp` / `getAuth` once the backend exists.
 */

import type { PartnerType } from '@/lib/rbac/types';

const SESSION_KEY = 'c1rcle.mock-auth.session';

interface MockSession {
  uid: string;
  email: string;
  displayName: string;
  partnerType: PartnerType;
}

export interface MockUser extends MockSession {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult: () => Promise<{ claims: Record<string, unknown> }>;
}

type Listener = (user: MockUser | null) => void;

const listeners = new Set<Listener>();
let session: MockSession | null = null;
let hydrated = false;

const isBrowser = (): boolean => typeof window !== 'undefined';

/** Reads the persisted session once, so a refresh keeps you signed in. */
function hydrate(): void {
  if (hydrated || !isBrowser()) return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    session = raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    session = null;
  }
}

function persist(next: MockSession | null): void {
  session = next;
  if (!isBrowser()) return;
  try {
    if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Private browsing / storage disabled — session simply won't survive reload.
  }
}

function toUser(s: MockSession | null): MockUser | null {
  if (!s) return null;
  return {
    ...s,
    getIdToken: () => Promise.resolve(`mock_token_${s.uid}`),
    // The provider prefers custom claims over the /api/auth/me payload when all
    // three partner claims are present, so supply them here.
    getIdTokenResult: () =>
      Promise.resolve({
        claims: {
          partnerId: `partner_${s.partnerType}_001`,
          partnerType: s.partnerType,
          partnerRole: 'owner',
        },
      }),
  };
}

function notify(): void {
  const user = toUser(session);
  for (const l of listeners) l(user);
}

/**
 * The partner type being signed in as. The login screen carries it in the URL
 * (`/login?type=venue`), which is the only signal available to this mock.
 */
function partnerTypeFromUrl(): PartnerType {
  if (!isBrowser()) return 'venue';
  const t = new URLSearchParams(window.location.search).get('type');
  return t === 'host' || t === 'promoter' || t === 'club' ? t : 'venue';
}

export function getFirebaseAuth() {
  hydrate();

  return {
    get currentUser() {
      return toUser(session);
    },

    onAuthStateChanged(callback: Listener) {
      hydrate();
      listeners.add(callback);
      // Fire once with the current state, as the real SDK does.
      const user = toUser(session);
      queueMicrotask(() => {
        callback(user);
      });
      return () => {
        listeners.delete(callback);
      };
    },

    signInWithEmailAndPassword(email: string, _password: string) {
      const partnerType = partnerTypeFromUrl();
      persist({
        uid: 'user_demo_123',
        email,
        displayName: `Demo ${partnerType.toUpperCase()} Partner`,
        partnerType,
      });
      notify();
      return Promise.resolve({ user: toUser(session) });
    },

    signOut() {
      persist(null);
      notify();
      return Promise.resolve();
    },
  };
}

export function getFirebaseStorage() {
  return {};
}

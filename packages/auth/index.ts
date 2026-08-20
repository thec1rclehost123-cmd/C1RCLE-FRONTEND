/**
 * @c1rcle/auth — V2 Backend Authentication Client
 *
 * Connects to the real V2 backend auth endpoints (/api/v2/auth/*).
 * Replaces the mock Firebase Auth client for the partner dashboard.
 *
 * Architecture:
 * - Access token: stored in memory only (never localStorage/sessionStorage/cookies)
 * - Session cookie: httpOnly, set by backend, sent automatically by browser
 * - Refresh: calls POST /api/v2/auth/refresh (cookie-based, no manual token handling)
 * - State management: listener pattern (same API shape as Firebase onAuthStateChanged)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthRole = 'guest' | 'partner' | 'admin';

export interface AuthUser {
  readonly id: string;
  /** Alias for id — backward compat with Firebase Auth user.uid */
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: AuthRole;
  readonly avatarUrl: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult: () => Promise<{ claims: Record<string, unknown> }>;
}

export interface AuthClient {
  onAuthStateChanged: (callback: (user: AuthUser | null) => void) => () => void;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
  signInWithGoogle: () => Promise<AuthUser>;
}

export type AuthStateListener = (user: AuthUser | null) => void;

// ─── V2 API Response Types ────────────────────────────────────────────────────

interface AuthBridgeResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: AuthRole;
    avatarUrl: string | null;
  };
  accessToken: string;
  expiresAt: number;
}

interface V2ErrorResponse {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
}

// ─── Token Store (memory only) ────────────────────────────────────────────────

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

function setAccessToken(token: string | null): void {
  accessToken = token;
}

// ─── Base URL ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const base =
    process.env['NEXT_PUBLIC_API_BASE_URL'] ||
    process.env['NEXT_PUBLIC_GATEWAY_URL'] ||
    'http://localhost:4000';
  return base.replace(/\/+$/, '');
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

class AuthError extends Error {
  code: string;
  status: number;
  fieldErrors: Record<string, string[]> | undefined;

  constructor(params: {
    message: string;
    code: string;
    status: number;
    fieldErrors?: Record<string, string[]>;
  }) {
    super(params.message);
    this.name = 'AuthError';
    this.code = params.code;
    this.status = params.status;
    if (params.fieldErrors !== undefined) {
      this.fieldErrors = params.fieldErrors;
    }
  }
}

async function v2Request<T>(
  path: string,
  options: { method?: string; body?: unknown; includeCredentials?: boolean } = {},
): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${path}`;

  const headers: Record<string, string> = {};

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: options.method ?? 'POST',
    headers,
    credentials: options.includeCredentials !== false ? 'include' : 'omit',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, init);

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errBody = data as V2ErrorResponse | null;
    const errParams: {
      message: string;
      code: string;
      status: number;
      fieldErrors?: Record<string, string[]>;
    } = {
      message: errBody?.message ?? `Auth request failed (${res.status})`,
      code: errBody?.code ?? 'unknown',
      status: res.status,
    };
    if (errBody?.fieldErrors !== undefined) {
      errParams.fieldErrors = errBody.fieldErrors;
    }
    throw new AuthError(errParams);
  }

  return data as T;
}

// ─── Auth State Management ────────────────────────────────────────────────────

const listeners = new Set<AuthStateListener>();
let currentUser: AuthUser | null = null;
let initialized = false;

function notify(): void {
  for (const l of listeners) {
    try {
      l(currentUser);
    } catch {
      // Listener threw — don't break other listeners
    }
  }
}

function setUser(user: AuthUser | null): void {
  currentUser = user;
  notify();
}

function toAuthUser(data: AuthBridgeResponse['user'], token: string): AuthUser {
  return {
    id: data.id,
    uid: data.id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    avatarUrl: data.avatarUrl,
    getIdToken: (_forceRefresh?: boolean) => Promise.resolve(token),
    getIdTokenResult: () =>
      Promise.resolve({
        claims: {},
      }),
  };
}

// ─── Initialization (browser only) ───────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Called once on first listener registration. Attempts to restore the session
 * from the httpOnly cookie by hitting GET /api/v2/auth/session, then refreshes
 * to obtain an in-memory access token.
 */
async function hydrate(): Promise<void> {
  if (!isBrowser() || initialized) return;
  initialized = true;

  try {
    const base = getBaseUrl();
    const refreshRes = await fetch(`${base}/api/v2/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const refreshData = (await refreshRes.json()) as AuthBridgeResponse;
      setAccessToken(refreshData.accessToken);
      setUser(toAuthUser(refreshData.user, refreshData.accessToken));
    } else {
      setUser(null);
    }
  } catch {
    setUser(null);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createAuthClient(): AuthClient {
  return {
    onAuthStateChanged(callback: AuthStateListener): () => void {
      listeners.add(callback);

      if (!initialized) {
        queueMicrotask(() => callback(null));
        hydrate();
      } else {
        queueMicrotask(() => callback(currentUser));
      }

      return () => {
        listeners.delete(callback);
      };
    },

    async signIn(email: string, password: string): Promise<AuthUser> {
      const data = await v2Request<AuthBridgeResponse>('/api/v2/auth/login', {
        body: { email, password },
      });

      setAccessToken(data.accessToken);
      const user = toAuthUser(data.user, data.accessToken);
      setUser(user);
      return user;
    },

    async signUp(
      email: string,
      password: string,
      displayName: string,
    ): Promise<AuthUser> {
      const data = await v2Request<AuthBridgeResponse>('/api/v2/auth/signup', {
        body: { email, password, displayName },
      });

      setAccessToken(data.accessToken);
      const user = toAuthUser(data.user, data.accessToken);
      setUser(user);
      return user;
    },

    async signOut(): Promise<void> {
      try {
        await v2Request<undefined>('/api/v2/auth/logout');
      } catch {
        // Logout endpoint may fail — still clear local state
      }
      setAccessToken(null);
      setUser(null);
    },

    async refreshSession(): Promise<AuthUser | null> {
      try {
        const data = await v2Request<AuthBridgeResponse>('/api/v2/auth/refresh');
        setAccessToken(data.accessToken);
        const user = toAuthUser(data.user, data.accessToken);
        setUser(user);
        return user;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      }
    },

    async signInWithGoogle(): Promise<AuthUser> {
      throw new AuthError({
        message: 'Google sign-in is not yet available. Please use email/password.',
        code: 'not_implemented',
        status: 501,
      });
    },
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _client: AuthClient | null = null;

export function getAuthClient(): AuthClient {
  if (!_client) {
    _client = createAuthClient();
  }
  return _client;
}



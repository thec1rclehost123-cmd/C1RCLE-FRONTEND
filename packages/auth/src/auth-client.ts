import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import {
  authBridgeResponseSchema,
  loginRequestSchema,
  noContentSchema,
  sessionSchema,
  signupRequestSchema,
} from '@c1rcle/contracts';

import { clearSession, getAccessToken, markAnonymous, setSession } from './session-store.js';

interface SignupInput {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

interface LoginInput {
  readonly email: string;
  readonly password: string;
}

/** Fixed, non-oracular message for any authentication failure. */
const GENERIC_AUTH_FAILURE = 'Authentication failed';

/** Non-httpOnly CSRF cookie the BFF sets on login/signup; echoed on cookie-authed calls. */
const CSRF_COOKIE = 'c1rcle.csrf';

// Refresh-stampede guard: holds the in-flight promise so concurrent callers await the same one.
let inFlightRefresh: Promise<boolean> | null = null;

/**
 * API client for the auth BFF routes (`/api/auth/*`), which live on the
 * frontend origin — NOT the gateway. Pointing `baseUrl` at the current
 * origin (rather than `NEXT_PUBLIC_API_BASE_URL`) is what keeps these calls
 * same-origin so the httpOnly session cookie is sent and received.
 *
 * No `reauth` handler here on purpose: these functions ARE the reauth
 * primitives, so wiring `reauth` back would recurse. `getToken` is still
 * supplied for the rare authenticated auth call.
 */
function createAuthClient() {
  const baseUrl = typeof window === 'undefined' ? '' : window.location.origin;
  return createApiClient({ baseUrl, getToken: getAccessToken });
}

/** Reads the double-submit CSRF token the BFF set, for the `x-csrf-token` header. */
function csrfHeaders(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }
  const match = new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]+)`).exec(document.cookie);
  return match?.[1] !== undefined ? { 'x-csrf-token': decodeURIComponent(match[1]) } : {};
}

/**
 * Sign up with email, password, and display name. The request body is
 * validated against `signupRequestSchema` before it leaves the browser; on
 * success the in-memory session is populated from the response.
 */
export async function signup(input: SignupInput): Promise<void> {
  const body = signupRequestSchema.parse({
    email: input.email,
    password: input.password,
    displayName: input.displayName,
  });

  const response = await createAuthClient().post({
    path: '/api/auth/signup',
    body,
    schema: authBridgeResponseSchema,
  });

  setSession({ user: response.user }, response.accessToken, response.expiresAt);
}

/**
 * Log in with email and password. Any 400/401 from the BFF is re-thrown as a
 * single generic message so the UI cannot be used as an account-existence
 * oracle; other failures (network, 5xx) propagate unchanged.
 */
export async function login(input: LoginInput): Promise<void> {
  const body = loginRequestSchema.parse({
    email: input.email,
    password: input.password,
  });

  try {
    const response = await createAuthClient().post({
      path: '/api/auth/login',
      body,
      schema: authBridgeResponseSchema,
    });

    setSession({ user: response.user }, response.accessToken, response.expiresAt);
  } catch (error) {
    if (isApiClientError(error) && (error.status === 400 || error.status === 401)) {
      throw new Error(GENERIC_AUTH_FAILURE);
    }
    throw error;
  }
}

/**
 * Exchange the httpOnly refresh cookie for a fresh in-memory access token.
 * Concurrent callers share one in-flight request (stampede guard). Resolves
 * `true` on success; on any failure the session is cleared and it resolves
 * `false`.
 */
export async function refresh(): Promise<boolean> {
  if (inFlightRefresh !== null) {
    return inFlightRefresh;
  }

  inFlightRefresh = (async () => {
    try {
      const response = await createAuthClient().post({
        path: '/api/auth/refresh',
        body: null,
        schema: authBridgeResponseSchema,
        headers: csrfHeaders(),
      });

      setSession({ user: response.user }, response.accessToken, response.expiresAt);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

/**
 * Revoke the server session and clear local state. The local session is
 * cleared even if the network call fails.
 */
export async function logout(): Promise<void> {
  try {
    await createAuthClient().post({
      path: '/api/auth/logout',
      body: null,
      schema: noContentSchema,
      headers: csrfHeaders(),
    });
  } catch {
    // Best-effort: the server session may already be gone, or the network may
    // be down. Local state is cleared regardless, so logout never rejects.
  } finally {
    clearSession();
  }
}

/**
 * Re-read the current session from the BFF (`{ user, expiresAt }` only — no
 * token). Keeps whatever access token is already in memory. A 401 or any
 * other failure marks the store anonymous.
 */
export async function fetchSession(): Promise<void> {
  try {
    const response = await createAuthClient().get({
      path: '/api/auth/session',
      schema: sessionSchema,
    });

    setSession({ user: response.user }, getAccessToken(), response.expiresAt);
  } catch {
    markAnonymous();
  }
}

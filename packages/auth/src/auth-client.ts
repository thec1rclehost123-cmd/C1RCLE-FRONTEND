import { createApiClient } from '@c1rcle/api-client';
import {
  authBridgeResponseSchema,
  loginRequestSchema,
  sessionSchema,
  signupRequestSchema,
} from '@c1rcle/contracts';
import { z } from 'zod';

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

// Refresh-stampede guard: holds the in-flight promise so concurrent calls await the same one
let inFlightRefresh: Promise<boolean> | null = null;

/**
 * Creates an API client for auth endpoints that call the BFF.
 * No reauth loop needed here (these ARE the reauth primitives).
 * getToken still available for other places that need it.
 */
function createAuthClient() {
  return createApiClient({
    getToken: getAccessToken,
  });
}

/**
 * Sign up with email, password, and display name.
 * Validates the request against signupRequestSchema before sending.
 * On success, sets the session with the returned token and expiry.
 * On failure, rethrows the ApiClientError.
 */
export async function signup(input: SignupInput): Promise<void> {
  const validatedBody = signupRequestSchema.parse({
    email: input.email,
    password: input.password,
    displayName: input.displayName,
  });

  const client = createAuthClient();
  const response = await client.post({
    path: '/api/auth/signup',
    body: validatedBody,
    schema: authBridgeResponseSchema,
  });

  setSession({ user: response.user }, response.accessToken, response.expiresAt);
}

/**
 * Log in with email and password.
 * Validates the request against loginRequestSchema before sending.
 * On success, sets the session with the returned token and expiry.
 * On 401/400, rethrows with a fixed generic message.
 */
export async function login(input: LoginInput): Promise<void> {
  const validatedBody = loginRequestSchema.parse({
    email: input.email,
    password: input.password,
  });

  try {
    const client = createAuthClient();
    const response = await client.post({
      path: '/api/auth/login',
      body: validatedBody,
      schema: authBridgeResponseSchema,
    });

    setSession({ user: response.user }, response.accessToken, response.expiresAt);
  } catch (error) {
    // On auth failure, throw a fixed generic message regardless of the backend response
    throw new Error('Authentication failed');
  }
}

/**
 * Refresh the access token.
 * Implements a stampede guard: concurrent calls await the same in-flight promise.
 * Returns true on success, false on any error.
 * Clears the session and returns false on failure.
 */
export async function refresh(): Promise<boolean> {
  // If a refresh is already in flight, wait for it
  if (inFlightRefresh !== null) {
    return inFlightRefresh;
  }

  inFlightRefresh = (async () => {
    try {
      const client = createAuthClient();
      const response = await client.post({
        path: '/api/auth/refresh',
        body: null,
        schema: authBridgeResponseSchema,
      });

      setSession({ user: response.user }, response.accessToken, response.expiresAt);
      return true;
    } catch (error) {
      clearSession();
      return false;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

/**
 * Log out by calling the logout endpoint.
 * Always clears the session, even on error.
 */
export async function logout(): Promise<void> {
  try {
    const client = createAuthClient();
    // Logout endpoint returns 204 (no content)
    // We use a minimal schema that accepts any response
    const noContentSchema = z.unknown();
    await client.post({
      path: '/api/auth/logout',
      body: null,
      schema: noContentSchema,
    });
  } finally {
    clearSession();
  }
}

/**
 * Fetch the current session.
 * On success, updates the session with the returned user and expiry.
 * On 401 or any error, marks the user as anonymous.
 */
export async function fetchSession(): Promise<void> {
  try {
    const client = createAuthClient();
    const response = await client.get({
      path: '/api/auth/session',
      schema: sessionSchema,
    });

    setSession({ user: response.user }, getAccessToken(), response.expiresAt);
  } catch (error) {
    markAnonymous();
  }
}

// Export session-store functions for composing with auth-client
export { clearSession, markAnonymous } from './session-store.js';

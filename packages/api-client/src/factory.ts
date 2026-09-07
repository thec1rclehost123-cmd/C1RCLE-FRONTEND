import { getClientEnv } from '@c1rcle/config';

import { ApiClient } from './client.js';

import type { ApiClientConfig } from './types.js';

/**
 * Builds a client pointed at the validated `NEXT_PUBLIC_API_BASE_URL`.
 *
 * Reading the environment here is deliberate: it means a deployment with a
 * missing or malformed API URL throws while the module graph is initialising,
 * not on the first user interaction.
 */
export function createApiClient(overrides: Partial<ApiClientConfig> = {}): ApiClient {
  return new ApiClient({
    baseUrl: getClientEnv().NEXT_PUBLIC_API_BASE_URL,
    ...overrides,
  });
}

let singleton: ApiClient | undefined;

/**
 * The shared browser-side client.
 *
 * Server components should call `createApiClient` with a per-request token
 * provider instead, so one user's credentials can never leak into another
 * user's request.
 */
export function getApiClient(): ApiClient {
  singleton ??= createApiClient();
  return singleton;
}

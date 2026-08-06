import type { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Resolves the bearer token for a request, or null when unauthenticated. */
export type TokenProvider = () => string | null | Promise<string | null>;

/** Called once when the backend rejects a request with 401. */
export type UnauthorizedHandler = () => void | Promise<void>;

export interface ApiClientConfig {
  readonly baseUrl: string;
  /** Milliseconds before a request is aborted. Defaults to 15000. */
  readonly timeoutMs?: number;
  /** Retry attempts for retryable failures. Defaults to 2. */
  readonly maxRetries?: number;
  readonly getToken?: TokenProvider;
  readonly onUnauthorized?: UnauthorizedHandler;
  /** Injectable for tests. Defaults to the platform `fetch`. */
  readonly fetchImpl?: typeof fetch;
}

export interface RequestOptions<TResponse> {
  readonly method?: HttpMethod;
  readonly path: string;
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  /**
   * Zod schema the response is parsed against. Required — an unvalidated
   * response is an untyped response, whatever the TypeScript signature claims.
   */
  readonly schema: z.ZodType<TResponse>;
  readonly signal?: AbortSignal;
  /** Overrides the client default for this call. */
  readonly timeoutMs?: number;
  readonly retries?: number;
}

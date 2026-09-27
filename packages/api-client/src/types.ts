import type { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Resolves the bearer token for a request, or null when unauthenticated. */
export type TokenProvider = () => string | null | Promise<string | null>;

/**
 * Called when the backend rejects a request with 401 and reauth has NOT
 * recovered it (no `reauth`, `reauth` returned false, or the retry also 401'd).
 * The terminal "give up" hook — clear the session and redirect to sign-in.
 */
export type UnauthorizedHandler = () => void | Promise<void>;

/**
 * Called on the first 401 of a request. Return `true` if a fresh credential
 * was obtained (the request is then replayed exactly once); `false` to give
 * up (the `unauthorized` error surfaces and `onUnauthorized` fires).
 * Typically `() => auth.refresh()`.
 */
export type ReauthHandler = () => Promise<boolean>;

export interface ApiClientConfig {
  readonly baseUrl: string;
  /** Milliseconds before a request is aborted. Defaults to 15000. */
  readonly timeoutMs?: number;
  /** Retry attempts for retryable failures. Defaults to 2. */
  readonly maxRetries?: number;
  readonly getToken?: TokenProvider;
  readonly reauth?: ReauthHandler;
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

/**
 * Options for a raw-text GET (e.g. a CSV export). Deliberately schema-less:
 * the caller wants the exact bytes, not a validated object.
 */
export interface TextRequestOptions {
  readonly path: string;
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly signal?: AbortSignal;
  /** Overrides the client default for this call. */
  readonly timeoutMs?: number;
  readonly retries?: number;
}

/**
 * Options for an `EventStream` (Server-Sent Events) connection. Deliberately
 * schema-less per call, same as `TextRequestOptions` — a stream carries
 * several different named event types over its lifetime, so validating one
 * fixed shape here would not fit; the caller validates per event name.
 */
export interface EventStreamOptions {
  readonly path: string;
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  /**
   * A stream is long-lived by nature — this bounds the *connection attempt*
   * (mirrors every other call's `timeoutMs`), not the stream's lifetime.
   * Defaults to the client's own `timeoutMs`, which is too short for most
   * streams; callers should pass one comfortably above the server's own
   * bounded stream lifetime, if it has one.
   */
  readonly timeoutMs?: number;
}

/** One SSE frame, already split into its `event:`/`data:` pair. Comment
 * lines (bare `: keep-alive`) carry neither and are never surfaced. */
export type EventStreamListener = (event: string, data: string) => void;

export interface EventStreamHandle {
  /** Aborts the underlying connection. Idempotent. */
  readonly close: () => void;
}

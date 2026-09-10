/* eslint-disable no-restricted-syntax --
 * This is the ONE module in the repository allowed to touch process.env.
 * Everything else imports the validated, typed values exported from here.
 */
import { clientEnvSchema, serverEnvSchema, type ClientEnv, type ServerEnv } from './schema.js';

import type { z } from 'zod';

class EnvironmentValidationError extends Error {
  public constructor(scope: string, issues: readonly z.core.$ZodIssue[]) {
    const details = issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    super(
      `Invalid ${scope} environment.\n\n${details}\n\n` +
        `Fix your .env file (see .env.example) and restart. ` +
        `The application will not start with an invalid environment.`,
    );
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Next.js statically replaces `process.env.NEXT_PUBLIC_*` at build time, but
 * only for full, literal member expressions. Destructuring or dynamic access
 * yields `undefined` in the browser, so each key is spelled out here.
 */
function readRawClientEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function parseOrThrow<TSchema extends z.ZodType>(
  schema: TSchema,
  raw: unknown,
  scope: string,
): z.infer<TSchema> {
  const result = schema.safeParse(raw);

  if (!result.success) {
    throw new EnvironmentValidationError(scope, result.error.issues);
  }

  return result.data;
}

let cachedClientEnv: ClientEnv | undefined;
let cachedServerEnv: ServerEnv | undefined;

/**
 * The validated public environment. Safe in both server and client components.
 *
 * Throws at first access — which, because it is read during module
 * initialisation of the API client, means a misconfigured deployment fails at
 * startup rather than at the first user request.
 */
export function getClientEnv(): ClientEnv {
  cachedClientEnv ??= parseOrThrow(clientEnvSchema, readRawClientEnv(), 'client');
  return cachedClientEnv;
}

/**
 * The validated server-only environment.
 *
 * @throws if called from the browser, where these values do not exist.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error(
      'getServerEnv() was called in the browser. Server environment values are not available to client code — use getClientEnv().',
    );
  }

  cachedServerEnv ??= parseOrThrow(
    serverEnvSchema,
    {
      NODE_ENV: process.env.NODE_ENV,
      SITE_URL: process.env.SITE_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      ANALYZE: process.env.ANALYZE,
    },
    'server',
  );

  return cachedServerEnv;
}

/** Test-only seam. Never call this from application code. */
export function resetEnvCacheForTests(): void {
  cachedClientEnv = undefined;
  cachedServerEnv = undefined;
}

export { EnvironmentValidationError };

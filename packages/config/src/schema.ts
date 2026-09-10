import { z } from 'zod';

/**
 * The declared environment contract.
 *
 * Rules:
 *  - Everything the frontend reads is declared here. No exceptions.
 *  - Only `NEXT_PUBLIC_*` values reach the browser. Anything else is
 *    server-only and must never be referenced from a client component.
 *  - There are no secrets in this repository. If a value would be dangerous
 *    to print in a browser devtools console, it belongs in the backend.
 */

const url = z.url({ error: 'must be an absolute URL including protocol' });

/** Values that are inlined into the client bundle and are therefore public. */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: url,
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'preview', 'production']),
  NEXT_PUBLIC_SENTRY_DSN: url.optional(),
  /**
   * GCP Identity Platform (Firebase Auth), scoped to ONE use: the
   * onboarding wizard's phone-verification step (`signInWithPhoneNumber`).
   * Same GCP project as the backend's `FIREBASE_PROJECT_ID` — these are the
   * public web-app config values, safe in a browser bundle by design (not
   * secrets; Firebase Auth's actual security boundary is server-side
   * `verifyIdToken`, not hiding this config). Optional so environments that
   * never touch the phone-verification step don't need them configured;
   * `getFirebaseAuth()` throws a clear error if called without them.
   */
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1).optional(),
});

/** Values that stay on the server. Never import this from a client component. */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ANALYZE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

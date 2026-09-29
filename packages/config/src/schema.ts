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
  NEXT_PUBLIC_GUEST_PORTAL_URL: url.default('https://thec1rcle.com'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'preview', 'production']),
  /**
   * Stable per-app slug (not the human-readable `NEXT_PUBLIC_APP_NAME`),
   * used to namespace browser-scoped state — e.g. the CSRF cookie name — so
   * guest-portal/partner-dashboard/admin-console don't collide when run
   * together on shared-host dev ports (browsers key cookies by host only,
   * not port).
   */
  NEXT_PUBLIC_APP_ID: z.enum(['guest', 'partner', 'admin']),
  NEXT_PUBLIC_SENTRY_DSN: url.optional(),
  /**
   * Firebase Web app config — client-side identifiers, not secrets (Firebase's
   * own docs: safe to ship in a browser bundle; access control is enforced
   * server-side, not by hiding these). Used only by `lib/firebase/phone-auth.ts`
   * for the onboarding wizard's phone-verification step. Optional: an
   * environment with no Firebase project configured just can't offer that step.
   */
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  /**
   * Fictional phone number used to prefill the onboarding wizard's
   * phone-verify step in non-production environments. With
   * `appVerificationDisabledForTesting` active there (see
   * `lib/firebase/phone-auth.ts`), the Firebase SDK accepts a test number
   * registered in the Firebase Console (Authentication → Phone → Test phone
   * numbers) and any of the test codes configured next to it — no SMS, no
   * reCAPTCHA. Never has an effect in production, where reCAPTCHA + real
   * SMS are mandatory. Optional: omit to leave the phone input empty.
   */
  NEXT_PUBLIC_FIREBASE_TEST_PHONE: z.string().min(1).optional(),
});

/** Values that stay on the server. Never import this from a client component. */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SITE_URL: url.optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_URL: z.string().min(1).optional(),
  ANALYZE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

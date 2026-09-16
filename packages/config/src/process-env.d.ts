/**
 * Declares the environment keys this package is allowed to read.
 *
 * Two reasons this exists rather than relaxing `noPropertyAccessFromIndexSignature`:
 *
 *  1. Next.js only statically inlines `NEXT_PUBLIC_*` values when it sees a
 *     literal dot-access member expression. Bracket access is not reliably
 *     replaced, so the variable would be `undefined` in the browser.
 *  2. Declaring the keys turns the environment contract into a compile-time
 *     one: a typo here is a type error, not a runtime surprise.
 *
 * Every key added here must also be added to `schema.ts` and `.env.example`.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE_URL?: string;
    NEXT_PUBLIC_APP_NAME?: string;
    NEXT_PUBLIC_ENVIRONMENT?: string;
    NEXT_PUBLIC_SENTRY_DSN?: string;
    NEXT_PUBLIC_FIREBASE_API_KEY?: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
    NEXT_PUBLIC_FIREBASE_TEST_PHONE?: string;
    NODE_ENV?: string;
    ANALYZE?: string;
  }
}

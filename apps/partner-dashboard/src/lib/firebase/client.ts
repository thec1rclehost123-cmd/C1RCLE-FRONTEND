/**
 * Real GCP Identity Platform (Firebase Auth) client, scoped to ONE use: the
 * onboarding wizard's phone-verification step (`signInWithPhoneNumber` +
 * `RecaptchaVerifier`, see `app/onboard/PageClient.tsx`). This is the ONE
 * legitimate client-side Firebase usage in this app's architecture —
 * `@c1rcle/auth` (Better Auth) owns account creation, login, and session
 * everywhere else. Identity Platform owns phone OTP send/verify/cooldown so
 * the backend never stores or rate-limits phone codes itself; the backend
 * only verifies the resulting ID token server-side (`firebase-admin`'s
 * `verifyIdToken`, see `C1RCLE-BACKEND`'s `firebase-phone-verifier.ts`).
 *
 * `initializeApp`/`getAuth` config values are public web-app config (not
 * secrets — see `packages/config/src/schema.ts`'s doc comment on the
 * `NEXT_PUBLIC_FIREBASE_*` vars). Same GCP project as the backend's
 * `FIREBASE_PROJECT_ID`.
 */

import { getApps, initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

import { getClientEnv } from '@c1rcle/config';

import type { FirebaseApp } from 'firebase/app';
import type { Auth, ConfirmationResult } from 'firebase/auth';

// Re-exported so this stays the ONE file in the app that imports `firebase/*`
// directly (enforced by `no-restricted-imports`, see eslint.config.ts) —
// callers (the onboard wizard's phone step) go through this module only.
export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (auth) return auth;

  const env = getClientEnv();
  if (
    !env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    !env.NEXT_PUBLIC_FIREBASE_APP_ID
  ) {
    throw new Error(
      'Phone verification is not configured: NEXT_PUBLIC_FIREBASE_API_KEY, ' +
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID and ' +
        'NEXT_PUBLIC_FIREBASE_APP_ID must all be set (see .env.example).',
    );
  }

  // `getApps()` guard: Next.js Fast Refresh re-runs this module without a
  // full page reload, and `initializeApp` throws if called twice for the
  // same app name.
  app ??=
    getApps()[0] ??
    initializeApp({
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });

  auth = getAuth(app);
  return auth;
}

/**
 * NOT real — `verify/PageClient.tsx`'s KYC-image upload still targets this.
 * Out of scope for the phone-verification fix; that page is a separate,
 * not-yet-rewired flow (see the frontend re-wire plan's remaining-work list).
 */
export function getFirebaseStorage() {
  return {};
}

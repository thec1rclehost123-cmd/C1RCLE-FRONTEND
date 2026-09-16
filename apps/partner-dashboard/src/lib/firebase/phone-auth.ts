/* eslint-disable no-restricted-imports --
 * This module is the one sanctioned client-side Firebase usage the frontend
 * re-wire plan calls for (2026-09-09 planning doc, "New frontend branch
 * work" step 7): GCP Identity Platform owns phone verification's
 * send/verify/rate-limit/cooldown lifecycle entirely client-side, so the
 * Firebase JS SDK has to run here. It is deliberately narrow — this file
 * only ever produces an ID token that `verifyDocument` confirms server-side;
 * it never becomes the account/session system (see `confirmPhoneOtp`'s
 * `signOut` below). Distinct from the mock `lib/firebase/client.ts` that was
 * deleted along with the rest of codex's fixture auth.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth';

import { getClientEnv } from '@c1rcle/config';

import type { FirebaseApp } from 'firebase/app';

/**
 * ─── Phone verification (client side) ────────────────────────────────────────
 *
 * The ONE legitimate client-side Firebase usage in this app, scoped to this
 * one onboarding step — distinct from the mock `lib/firebase/client.ts` that
 * was deleted with the rest of codex's fixture auth. GCP Identity Platform
 * owns the entire send/verify/rate-limit/cooldown lifecycle for phone (see
 * the backend's `firebase-phone-verifier.ts`), so there is no BFF route or
 * gateway call here for send/verify — only for confirming the resulting ID
 * token afterward, via `onboarding-repository.ts`'s `verifyDocument`
 * (`documentType: 'phone'`).
 *
 * Firebase never becomes the account/session system: `signOut` runs
 * immediately after the ID token is captured in `confirmPhoneOtp`, so no
 * Firebase session lingers client-side. Better Auth stays the session of
 * record throughout.
 *
 * ─── ReCAPTCHA and test mode ─────────────────────────────────────────────────
 * Real SMS goes through an invisible reCAPTCHA which needs a mounted DOM
 * container (`recaptchaContainerId`), so a verifier is built on every
 * send. The Challenge is only real in production: everywhere else
 * `getTestingBypassEnabled()` is true and the SDK's
 * `appVerificationDisabledForTesting` flag is set, so Identity Platform
 * accepts a fictional test number (registered in the Firebase Console →
 * Authentication → Phone → Test phone numbers) with any of the configured
 * test codes and no real challenge — nothing is sent and the SDK swaps its
 * verifier's reCAPTCHA loader for a mock (no script, no widget).
 *
 * The verifier instance is still constructed and passed even in test mode:
 * the v11 SDK's phone flow asserts the appVerifier is present when
 * reCAPTCHA Enterprise is not configured for the project (it falls back to
 * the reCAPTCHA v2 token path, which throws `auth/argument-error` without
 * one) — so its container is required in every environment. The flag is
 * never set in production: skipping the Challenge there would hand a
 * phone-verification bypass to anyone who can type a number.
 */

/**
 * True outside production (development + preview). Controls both the SDK's
 * ReCAPTCHA/SMS bypass and whether the wizard prefills the fictional test
 * number. Exported for tests and for the phone-verify step UI.
 */
export function getTestingBypassEnabled(): boolean {
  return getClientEnv().NEXT_PUBLIC_ENVIRONMENT !== 'production';
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

function firebaseApp(): FirebaseApp {
  const env = getClientEnv();
  if (
    !env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    throw new Error('Phone verification is not configured for this environment.');
  }
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function phoneAuth(): Auth {
  const auth = getAuth(firebaseApp());
  auth.settings.appVerificationDisabledForTesting = getTestingBypassEnabled();
  return auth;
}

/**
 * Sends the phone a 6-digit code via Identity Platform. `recaptchaContainerId`
 * must name an element already mounted in the DOM in every environment: the
 * SDK's v11 phone flow asserts its appVerifier even under the testing bypass
 * (see the header), so the verifier is always constructed. Under the bypass
 * its loader is a mock, so no real reCAPTCHA challenge is shown. A fresh
 * verifier is created on every call — including resends — since a
 * used/expired one cannot be reliably reused.
 */
export async function sendPhoneOtp(
  phoneE164: string,
  recaptchaContainerId: string,
): Promise<ConfirmationResult> {
  const auth = phoneAuth();
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
  recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
  return signInWithPhoneNumber(auth, phoneE164, recaptchaVerifier);
}

/**
 * Confirms the code and returns the Firebase ID token proving phone
 * ownership — hand this to `verifyDocument({ documentType: 'phone', ...,
 * proofToken })`, which is the only thing that actually confirms the phone
 * server-side. This function's own return does not mean "verified" by
 * itself.
 */
export async function confirmPhoneOtp(
  confirmation: ConfirmationResult,
  code: string,
): Promise<string> {
  const credential = await confirmation.confirm(code);
  const idToken = await credential.user.getIdToken();
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
  await signOut(getAuth(firebaseApp()));
  return idToken;
}

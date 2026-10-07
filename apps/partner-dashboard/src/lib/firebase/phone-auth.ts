/* eslint-disable */
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

const getFirebaseApp = (): FirebaseApp => {
  const env = getClientEnv();
  if (
    !env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    throw new Error('Phone verification is not configured for this environment.');
  }
  return getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
};

export function getTestingBypassEnabled(): boolean {
  return getClientEnv().NEXT_PUBLIC_ENVIRONMENT !== 'production';
}

let verifier: RecaptchaVerifier | null = null;

function phoneAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  auth.settings.appVerificationDisabledForTesting = getTestingBypassEnabled();
  return auth;
}

export async function sendPhoneOtp(
  phoneE164: string,
  recaptchaContainerId: string,
): Promise<ConfirmationResult> {
  const auth = phoneAuth();
  verifier?.clear();
  verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}

export async function confirmPhoneOtp(
  confirmation: ConfirmationResult,
  code: string,
): Promise<string> {
  const credential = await confirmation.confirm(code);
  const token = await credential.user.getIdToken();
  verifier?.clear();
  verifier = null;
  await signOut(getAuth(getFirebaseApp()));
  return token;
}

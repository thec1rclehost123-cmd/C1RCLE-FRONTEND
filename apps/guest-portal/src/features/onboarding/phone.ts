/* eslint-disable no-restricted-imports -- Firebase Web Auth is used only to obtain a phone-verification proof; C1RCLE identity and sessions remain in @c1rcle/auth. Reuses the existing Partner phone provider, with no database SDK or testing bypass. */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';

import { getClientEnv } from '@c1rcle/config';

import type { ConfirmationResult } from 'firebase/auth';

let recaptcha: RecaptchaVerifier | null = null;
function auth() {
  const env = getClientEnv();
  if (
    !env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
    throw new Error('Phone verification is unavailable. Please try again later.');
  const name = 'c1rcle-guest-phone';
  const app = getApps().some((app) => app.name === name)
    ? getApp(name)
    : initializeApp(
        {
          apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        },
        name,
      );
  return getAuth(app);
}
export async function requestPhoneCode(phone: string): Promise<ConfirmationResult> {
  if (!/^\+[1-9]\d{7,14}$/.test(phone))
    throw new Error('Enter your phone number with its country code.');
  clearPhoneChallenge();
  const instance = auth();
  recaptcha = new RecaptchaVerifier(instance, 'guest-phone-challenge', { size: 'invisible' });
  try {
    return await signInWithPhoneNumber(instance, phone, recaptcha);
  } catch (error) {
    clearPhoneChallenge();
    throw error;
  }
}
export async function confirmPhoneCode(
  confirmation: ConfirmationResult,
  code: string,
): Promise<string> {
  const credential = await confirmation.confirm(code);
  try {
    return await credential.user.getIdToken();
  } finally {
    clearPhoneChallenge();
    await signOut(auth());
  }
}
export function clearPhoneChallenge() {
  recaptcha?.clear();
  recaptcha = null;
}

export type PhoneConfirmation = ConfirmationResult;

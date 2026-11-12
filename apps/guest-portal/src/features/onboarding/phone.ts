/* eslint-disable no-restricted-imports -- Firebase Web Auth is used only to obtain a phone-verification proof; C1RCLE identity and sessions remain in @c1rcle/auth. Reuses the existing Partner phone provider, with no database SDK or testing bypass. */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';

import { getClientEnv } from '@c1rcle/config';

import type { ConfirmationResult } from 'firebase/auth';

let recaptcha: RecaptchaVerifier | null = null;
export function phoneAuthErrorMessage(error: unknown, phase: 'send' | 'verify'): string {
  const rawCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined;
  const code = typeof rawCode === 'string' ? rawCode : '';
  if (code.includes('invalid-phone-number'))
    return 'Enter your phone number with its country code.';
  if (code.includes('invalid-verification-code'))
    return 'That code is incorrect. Check it and try again.';
  if (code.includes('code-expired') || code.includes('session-expired'))
    return 'That code has expired. Request a new one.';
  if (code.includes('too-many-requests') || code.includes('quota-exceeded'))
    return 'Too many attempts. Please wait before trying again.';
  if (code.includes('network-request-failed'))
    return 'Network issue. Check your connection and try again.';
  if (
    code.includes('captcha') ||
    code.includes('app-not-authorized') ||
    code.includes('invalid-app-credential')
  )
    return 'Phone verification could not start. Please try again later.';
  if (code.includes('operation-not-allowed') || code.includes('auth/invalid-api-key'))
    return 'Phone verification is not configured for this environment.';
  return phase === 'send'
    ? 'A verification code could not be sent. Please try again later.'
    : 'Verification could not be completed. Request a new code and try again.';
}
function auth(phone: string) {
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
  const instance = getAuth(app);
  // Firebase's official configured test number is the only case allowed to
  // disable reCAPTCHA. Real numbers always use the normal provider path.
  instance.settings.appVerificationDisabledForTesting =
    Boolean(env.NEXT_PUBLIC_FIREBASE_TEST_PHONE) && phone === env.NEXT_PUBLIC_FIREBASE_TEST_PHONE;
  return instance;
}
export async function requestPhoneCode(phone: string): Promise<ConfirmationResult> {
  if (!/^\+[1-9]\d{7,14}$/.test(phone))
    throw new Error('Enter your phone number with its country code.');
  clearPhoneChallenge();
  const instance = auth(phone);
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
  try {
    const credential = await confirmation.confirm(code);
    return await credential.user.getIdToken();
  } finally {
    clearPhoneChallenge();
    await signOut(auth('')).catch(() => undefined);
  }
}
export function clearPhoneChallenge() {
  recaptcha?.clear();
  recaptcha = null;
}

export type PhoneConfirmation = ConfirmationResult;

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { confirmPhoneOtp, getTestingBypassEnabled, sendPhoneOtp } from './phone-auth';

const mocks = vi.hoisted(() => {
  const getClientEnv = vi.fn();
  const authSettings: { appVerificationDisabledForTesting: boolean | undefined } = {
    appVerificationDisabledForTesting: undefined,
  };
  const auth = { settings: authSettings };
  const getAuth = vi.fn(() => auth);
  const signInWithPhoneNumber = vi.fn();
  const signOut = vi.fn(() => undefined);
  const RecaptchaVerifier = vi.fn(function (this: { clear: ReturnType<typeof vi.fn> }) {
    this.clear = vi.fn();
  });
  return {
    getClientEnv,
    auth,
    authSettings,
    getAuth,
    signInWithPhoneNumber,
    signOut,
    RecaptchaVerifier,
  };
});

vi.mock('firebase/app', () => ({
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  RecaptchaVerifier: mocks.RecaptchaVerifier,
  getAuth: mocks.getAuth,
  signInWithPhoneNumber: mocks.signInWithPhoneNumber,
  signOut: mocks.signOut,
}));

vi.mock('@c1rcle/config', () => ({
  getClientEnv: mocks.getClientEnv,
}));

function clientEnv(overrides: Record<string, unknown> = {}) {
  return {
    NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8080',
    NEXT_PUBLIC_APP_NAME: 'C1RCLE Partner Dashboard',
    NEXT_PUBLIC_ENVIRONMENT: 'development',
    NEXT_PUBLIC_FIREBASE_API_KEY: 'api-key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'c1rcle.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'c1rcle',
    ...overrides,
  };
}

function fakeConfirmation() {
  return {
    confirm: vi.fn(() => ({ user: { getIdToken: vi.fn(() => 'firebase-id-token') } })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authSettings.appVerificationDisabledForTesting = undefined;
});

describe('getTestingBypassEnabled', () => {
  it('is enabled in development', () => {
    mocks.getClientEnv.mockReturnValue(clientEnv({ NEXT_PUBLIC_ENVIRONMENT: 'development' }));
    expect(getTestingBypassEnabled()).toBe(true);
  });

  it('is enabled in preview', () => {
    mocks.getClientEnv.mockReturnValue(clientEnv({ NEXT_PUBLIC_ENVIRONMENT: 'preview' }));
    expect(getTestingBypassEnabled()).toBe(true);
  });

  it('is never enabled in production', () => {
    mocks.getClientEnv.mockReturnValue(clientEnv({ NEXT_PUBLIC_ENVIRONMENT: 'production' }));
    expect(getTestingBypassEnabled()).toBe(false);
  });
});

describe('sendPhoneOtp', () => {
  it('sets the testing flag and still attaches the (mock-internal) verifier outside production', async () => {
    mocks.getClientEnv.mockReturnValue(clientEnv({ NEXT_PUBLIC_ENVIRONMENT: 'development' }));

    await sendPhoneOtp('+15555550100', 'phone-verify-recaptcha');

    expect(mocks.authSettings.appVerificationDisabledForTesting).toBe(true);
    expect(mocks.RecaptchaVerifier).toHaveBeenCalledTimes(1);
    expect(mocks.RecaptchaVerifier).toHaveBeenCalledWith(
      mocks.auth,
      'phone-verify-recaptcha',
      { size: 'invisible' },
    );
    expect(mocks.signInWithPhoneNumber).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithPhoneNumber).toHaveBeenCalledWith(
      mocks.auth,
      '+15555550100',
      expect.anything(),
    );
  });

  it('keeps reCAPTCHA and the container requirement in production', async () => {
    mocks.getClientEnv.mockReturnValue(clientEnv({ NEXT_PUBLIC_ENVIRONMENT: 'production' }));

    await sendPhoneOtp('+919876543210', 'phone-verify-recaptcha');

    expect(mocks.authSettings.appVerificationDisabledForTesting).toBe(false);
    expect(mocks.RecaptchaVerifier).toHaveBeenCalledTimes(1);
    expect(mocks.RecaptchaVerifier).toHaveBeenCalledWith(
      mocks.auth,
      'phone-verify-recaptcha',
      { size: 'invisible' },
    );
    expect(mocks.signInWithPhoneNumber).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithPhoneNumber).toHaveBeenCalledWith(
      mocks.auth,
      '+919876543210',
      expect.anything(),
    );
  });
});

describe('confirmPhoneOtp', () => {
  it('returns the ID token and tears down the verifier and the Firebase session', async () => {
    mocks.getClientEnv.mockReturnValue(clientEnv({ NEXT_PUBLIC_ENVIRONMENT: 'production' }));

    await sendPhoneOtp('+919876543210', 'phone-verify-recaptcha');
    const verifier = mocks.RecaptchaVerifier.mock.instances[0] as {
      clear: ReturnType<typeof vi.fn>;
    };

    const token = await confirmPhoneOtp(
      fakeConfirmation() as unknown as Parameters<typeof confirmPhoneOtp>[0],
      '123456',
    );

    expect(token).toBe('firebase-id-token');
    expect(verifier.clear).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).toHaveBeenCalledWith(mocks.auth);
  });
});
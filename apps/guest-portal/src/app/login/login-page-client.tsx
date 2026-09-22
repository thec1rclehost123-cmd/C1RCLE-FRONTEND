'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { login, signup, useSession } from '@c1rcle/auth';
import { guestProfileDtoSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import { LoginFormCard } from '../../features/auth/components/LoginFormCard';
import { LoginHeroPanel } from '../../features/auth/components/LoginHeroPanel';
import { loginFixture } from '../../features/auth/fixtures/login.fixture';

import type {
  AuthMode,
  AuthStep,
  LoginFormState,
  LoginStatusState,
} from '../../features/auth/types/login.types';

/**
 * Demo email-verification gate. The OTP is intentionally fixed
 * (`loginFixture.defaultOtp`) — it gates the backend signup/login call locally
 * without requiring real email delivery. The actual session is always created
 * by the backend (`POST /api/auth/signup|login` → gateway `/api/v2/auth/*`);
 * this code alone never authenticates.
 */
export function isValidFixtureOtp(otp: string) {
  return otp.length === 6 && otp === loginFixture.defaultOtp;
}

export const isValidDemoOtp = isValidFixtureOtp;

function isAdult(dateOfBirth: string) {
  if (!dateOfBirth) return false;
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!birthdayHasPassed) age -= 1;
  return age >= 18;
}

export interface LoginPageClientProps {
  readonly initialMode?: AuthMode;
  /** Safe same-origin return path (`?next=`), resolved server-side in `page.tsx`. */
  readonly nextPath?: string | null;
}

const initialForm: LoginFormState = {
  email: '',
  password: '',
  otp: '',
  name: '',
  dateOfBirth: '',
  city: 'Pune',
  tastes: [],
  intents: [],
};

const BACK_STEP: Partial<Record<AuthStep, AuthStep>> = {
  verify_otp: 'credentials',
  identity: 'verify_otp',
  city: 'identity',
  tastes: 'city',
  intent: 'tastes',
};

export function LoginPageClient({ initialMode = 'login', nextPath = null }: LoginPageClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useSession();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>('credentials');
  const [status, setStatus] = useState<LoginStatusState>({ type: 'idle' });
  const [form, setForm] = useState<LoginFormState>(initialForm);
  const [loading, setLoading] = useState(false);
  /**
   * The backend account is created once at the end of onboarding; the profile
   * save is retried without re-registering. Reset with the rest of the form.
   */
  const accountCreatedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextPath ?? '/explore');
    }
  }, [isAuthenticated, nextPath, router]);

  const handleFormChange = (field: keyof LoginFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    if (status.type === 'error') setStatus({ type: 'idle' });
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setStep('credentials');
    setStatus({ type: 'idle' });
    setForm((previous) => ({ ...previous, otp: '' }));
    accountCreatedRef.current = false;
  };

  const failAuth = (error: unknown) => {
    setLoading(false);
    if (isApiClientError(error)) {
      setStatus({
        type: 'error',
        message: error.message || 'Authentication failed. Please try again.',
      });
      return;
    }
    if (error instanceof Error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }
    setStatus({ type: 'error', message: 'Authentication failed. Please try again.' });
  };

  const succeedAuth = () => {
    setLoading(false);
    setStep('complete');
    setStatus({ type: 'idle' });
    if (nextPath !== null) {
      router.replace(nextPath);
    }
  };

  const submitLogin = () => {
    setLoading(true);
    setStatus({ type: 'idle' });
    void login({ email: form.email.trim(), password: form.password }).then(
      () => {
        succeedAuth();
      },
      (error: unknown) => {
        failAuth(error);
      },
    );
  };

  const submitSignup = () => {
    setLoading(true);
    setStatus({ type: 'idle' });
    const email = form.email.trim();
    const profileBody = {
      displayName: form.name.trim(),
      dateOfBirth: form.dateOfBirth,
      city: form.city,
      tastes: form.tastes,
      intents: form.intents,
    };
    void (async () => {
      try {
        if (!accountCreatedRef.current) {
          await signup({ email, password: form.password, displayName: profileBody.displayName });
          accountCreatedRef.current = true;
        }
        // Bearer-direct data call (no BFF): the in-memory token was just set
        // by signup(), and apiClient reauth-refreshes it if it lapsed.
        await apiClient.put({
          path: '/api/v2/profile/me',
          body: profileBody,
          schema: guestProfileDtoSchema,
        });
        succeedAuth();
      } catch (error: unknown) {
        failAuth(error);
      }
    })();
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    if (step === 'credentials') {
      const email = form.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus({ type: 'error', message: 'Enter a valid email address.' });
        return;
      }
      if (mode === 'signup') {
        if (form.password.length < 8) {
          setStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
          return;
        }
      } else if (form.password.length < 1) {
        setStatus({ type: 'error', message: 'Enter your password.' });
        return;
      }
      setForm((previous) => ({ ...previous, email }));
      // Login needs no verification step — email + password is enough.
      // Signup keeps the demo-code gate before onboarding (unchanged).
      if (mode === 'login') {
        submitLogin();
        return;
      }
      setStep('verify_otp');
      setStatus({ type: 'idle' });
      return;
    }

    // The OTP gate is signup-only now; login authenticates straight from
    // credentials. The login branch below is defensive and unreachable.
    if (step === 'verify_otp') {
      if (!isValidFixtureOtp(form.otp)) {
        setStatus({ type: 'error', message: 'Invalid verification code.' });
        return;
      }
      if (mode === 'login') {
        submitLogin();
        return;
      }
      setStep('identity');
      setStatus({ type: 'idle' });
      return;
    }

    // Remaining steps are signup-only onboarding; the backend account is
    // created at the end (intent) with the preferred name as displayName.
    if (mode !== 'signup') return;

    if (step === 'identity') {
      if (form.name.trim().length < 2) {
        setStatus({ type: 'error', message: 'Tell us what we should call you.' });
        return;
      }
      if (!isAdult(form.dateOfBirth)) {
        setStatus({ type: 'error', message: 'You must be at least 18 years old.' });
        return;
      }
      setStep('city');
      setStatus({ type: 'idle' });
      return;
    }

    if (step === 'city') {
      setStep('tastes');
      setStatus({ type: 'idle' });
      return;
    }

    if (step === 'tastes') {
      if (form.tastes.length < 3) {
        setStatus({ type: 'error', message: 'Pick at least three kinds of nights.' });
        return;
      }
      setStep('intent');
      setStatus({ type: 'idle' });
      return;
    }

    if (step === 'intent') {
      if (form.intents.length < 1) {
        setStatus({ type: 'error', message: 'Choose at least one reason.' });
        return;
      }
      submitSignup();
    }
  };

  const toggleChoice = (field: 'tastes' | 'intents', value: string) => {
    setForm((previous) => {
      const current = previous[field];
      return {
        ...previous,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
    if (status.type === 'error') setStatus({ type: 'idle' });
  };

  const goBack = () => {
    const previous = BACK_STEP[step];
    if (previous !== undefined) {
      setStep(previous);
      setStatus({ type: 'idle' });
    }
  };

  const restartPreview = () => {
    setMode('login');
    setStep('credentials');
    setStatus({ type: 'idle' });
    setForm(initialForm);
    setLoading(false);
    accountCreatedRef.current = false;
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white selection:bg-[#FF4400]/30 selection:text-white">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <LoginHeroPanel
          headline={loginFixture.hero.headline}
          tagline={loginFixture.hero.tagline}
        />

        <section className="relative flex flex-1 items-center justify-center bg-black px-6 py-24 md:px-12 md:py-16">
          {BACK_STEP[step] !== undefined && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="absolute left-6 top-7 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:border-[#FF4400] hover:text-[#FF4400] md:left-12"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M10 19l-7-7m0 0 7-7m-7 7h18"
                />
              </svg>
            </button>
          )}

          <LoginFormCard
            mode={mode}
            step={step}
            form={form}
            status={status}
            loading={loading}
            fixture={loginFixture}
            onModeChange={handleModeChange}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
            onToggleChoice={toggleChoice}
            onEditCredentials={() => {
              setStep('credentials');
              setStatus({ type: 'idle' });
            }}
            onResendOtp={() => {
              handleFormChange('otp', '');
              setStatus({ type: 'idle' });
            }}
            onRestart={restartPreview}
          />
        </section>
      </div>
    </div>
  );
}

'use client';

// FIXTURE_ONLY: Temporary UI development page client.
// Must not be used as a production API fallback.

import React, { useState } from 'react';

import { LoginFormCard } from '../../features/auth/components/LoginFormCard';
import { LoginHeroPanel } from '../../features/auth/components/LoginHeroPanel';
import { loginFixture } from '../../features/auth/fixtures/login.fixture';

import type {
  AuthProviderPreview,
  AuthStep,
  LoginFormState,
  LoginStatusState,
} from '../../features/auth/types/login.types';

export function isValidFixtureOtp(otp: string) {
  return otp.length === 6 && otp === loginFixture.defaultOtp;
}

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

const initialForm: LoginFormState = {
  phone: '',
  country: 'IN',
  otp: '',
  name: '',
  dateOfBirth: '',
  city: 'Pune',
  tastes: [],
  intents: [],
};

export function LoginPageClient() {
  const [provider, setProvider] = useState<AuthProviderPreview>(null);
  const [step, setStep] = useState<AuthStep>('methods');
  const [status, setStatus] = useState<LoginStatusState>({ type: 'idle' });
  const [form, setForm] = useState<LoginFormState>(initialForm);

  const handleFormChange = (field: keyof LoginFormState, value: string | string[]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    if (status.type === 'error') setStatus({ type: 'idle' });
  };

  const handleProvider = (nextProvider: Exclude<AuthProviderPreview, null>) => {
    setProvider(nextProvider);
    if (nextProvider === 'phone') {
      setStep('phone');
      setStatus({ type: 'idle' });
      return;
    }

    setStep('identity');
    setStatus({ type: 'idle' });
  };

  const handleBack = () => {
    const previousStep: Partial<Record<AuthStep, AuthStep>> = {
      phone: 'methods',
      verify_otp: 'phone',
      identity: provider === 'phone' ? 'verify_otp' : 'methods',
      city: 'identity',
      tastes: 'city',
      intent: 'tastes',
      complete: 'intent',
    };
    setStep(previousStep[step] ?? 'methods');
    setStatus({ type: 'idle' });
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === 'phone') {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 8) {
        setStatus({ type: 'error', message: 'Enter a valid mobile number.' });
        return;
      }
      setStep('verify_otp');
      setStatus({ type: 'idle' });
      return;
    }

    if (step === 'verify_otp') {
      if (!isValidFixtureOtp(form.otp)) {
        setStatus({
          type: 'error',
          message: 'Invalid verification code.',
        });
        return;
      }
      setStep('identity');
      setStatus({ type: 'idle' });
      return;
    }

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
      setStep('complete');
      setStatus({ type: 'idle' });
    }
  };

  const toggleChoice = (field: 'tastes' | 'intents', value: string) => {
    const current = form[field];
    handleFormChange(
      field,
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const restartPreview = () => {
    setProvider(null);
    setStep('methods');
    setStatus({ type: 'idle' });
    setForm(initialForm);
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white selection:bg-[#FF4400]/30 selection:text-white">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <LoginHeroPanel
          headline={loginFixture.hero.headline}
          tagline={loginFixture.hero.tagline}
        />

        <section className="relative flex flex-1 items-center justify-center bg-black px-6 py-24 md:px-12 md:py-16">
          {step !== 'methods' && step !== 'complete' && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="absolute left-6 top-7 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:border-[#FF4400] hover:text-[#FF4400] md:left-12"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0 7-7m-7 7h18" />
              </svg>
            </button>
          )}

          <LoginFormCard
            step={step}
            form={form}
            status={status}
            fixture={loginFixture}
            onProvider={handleProvider}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
            onToggleChoice={toggleChoice}
            onEditPhone={() => { setStep('phone'); }}
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

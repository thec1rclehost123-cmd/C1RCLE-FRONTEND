'use client';

// FIXTURE_ONLY: Temporary UI development page client.
// Must not be used as a production API fallback.

import React, { useState } from 'react';

import { LoginFormCard } from '../../features/auth/components/LoginFormCard';
import { LoginHeroPanel } from '../../features/auth/components/LoginHeroPanel';
import { loginFixture } from '../../features/auth/fixtures/login.fixture';

import type {
  AuthMode,
  AuthStep,
  LoginFormState,
  LoginStatusState,
} from '../../features/auth/types/login.types';

export function isValidFixtureOtp(otp: string) {
  return otp.length === 6 && otp === loginFixture.defaultOtp;
}

export function LoginPageClient() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<AuthStep>('credentials');
  const [status, setStatus] = useState<LoginStatusState>({ type: 'idle' });

  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
    phone: '',
    country: 'IN',
    name: '',
    age: '',
    gender: 'Male',
    city: 'Mumbai',
    otp: '',
  });

  const handleFormChange = (field: keyof LoginFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (status.type === 'error') {
      setStatus({ type: 'idle' });
    }
  };

  const handleToggleMode = () => {
    const nextMode = mode === 'login' ? 'signup' : 'login';
    setMode(nextMode);
    setStep('credentials');
    setStatus({ type: 'idle' });
  };

  const handleBack = () => {
    if (step === 'phone') {
      setStep('credentials');
    } else if (step === 'name') {
      setStep('phone');
    } else if (step === 'age') {
      setStep('name');
    } else if (step === 'gender') {
      setStep('age');
    } else if (step === 'city') {
      setStep('gender');
    } else if (step === 'verify_otp') {
      setStep('phone');
    } else {
      setStatus({ type: 'idle' });
    }
  };

  const handleGoogleLogin = () => {
    setStatus({ type: 'loading' });
    setTimeout(() => {
      setForm((prev) => ({
        ...prev,
        email: loginFixture.demoUser.email,
        name: loginFixture.demoUser.name,
      }));
      setStatus({
        type: 'success',
        message: 'Google UI preview complete · No authentication occurred',
      });
    }, 600);
  };

  const handleNext = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (step === 'credentials') {
      if (!form.email || !form.password) {
        setStatus({ type: 'error', message: 'Please enter your email and password.' });
        return;
      }
      if (mode === 'login') {
        setStatus({ type: 'loading' });
        setTimeout(() => {
          setStatus({
            type: 'success',
            message: 'Login UI preview complete · No session created',
          });
        }, 800);
      } else {
        setStep('phone');
      }
      return;
    }

    if (step === 'phone') {
      if (!form.phone || form.phone.length < 8) {
        setStatus({ type: 'error', message: 'Please enter a valid phone number.' });
        return;
      }
      setStep('name');
      return;
    }

    if (step === 'name') {
      if (!form.name.trim()) {
        setStatus({ type: 'error', message: 'Please enter your name.' });
        return;
      }
      setStep('age');
      return;
    }

    if (step === 'age') {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < 18) {
        setStatus({ type: 'error', message: 'Must be 18 or older to join.' });
        return;
      }
      setStep('gender');
      return;
    }

    if (step === 'gender') {
      setStep('city');
      return;
    }

    if (step === 'city') {
      setStep('verify_otp');
      return;
    }

    if (!isValidFixtureOtp(form.otp)) {
      setStatus({ type: 'error', message: 'Invalid OTP code. Use 123456 for demo.' });
      return;
    }
    setStatus({ type: 'loading' });
    setTimeout(() => {
      setStatus({
        type: 'success',
        message: 'Signup UI preview complete · No account created',
      });
    }, 800);
  };

  const handleResendOtp = () => {
    setStatus({ type: 'loading' });
    setTimeout(() => {
      setStatus({
        type: 'idle',
        message: `New code sent! Demo OTP is ${loginFixture.defaultOtp}`,
      });
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white selection:bg-[#FF4400]/30 selection:text-white">
      {/* Main Responsive Grid Layout */}
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        {/* Left Orange Branding Panel */}
        <LoginHeroPanel
          headline={loginFixture.hero.headline}
          tagline={loginFixture.hero.tagline}
        />

        {/* Right Dark Form Panel */}
        <section className="flex flex-1 items-center justify-center bg-black px-6 py-28 md:px-12 md:py-20 relative">
          {/* Step Back Button */}
          {step !== 'credentials' && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="absolute top-8 left-6 md:left-12 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-2xl hover:border-[#FF4400] hover:bg-white/10 transition-all text-white hover:text-[#FF4400]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}

          <LoginFormCard
            mode={mode}
            step={step}
            form={form}
            status={status}
            cities={loginFixture.availableCities}
            countries={loginFixture.supportedCountries}
            onFormChange={handleFormChange}
            onNext={handleNext}
            onGoogleLogin={handleGoogleLogin}
            onToggleMode={handleToggleMode}
            onSetStep={(st) => {
              setStep(st);
            }}
            onResendOtp={handleResendOtp}
          />
        </section>
      </div>
    </div>
  );
}

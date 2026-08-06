'use client';

// FIXTURE_ONLY: Temporary UI development page client.
// Must not be used as a production API fallback.

import React, { useState } from 'react';

import { LoginFormCard } from '../../features/auth/components/LoginFormCard';
import { LoginHeaderNav } from '../../features/auth/components/LoginHeaderNav';
import { LoginHeroPanel } from '../../features/auth/components/LoginHeroPanel';
import { loginFixture } from '../../features/auth/fixtures/login.fixture';

import type {
  AuthMode,
  AuthStep,
  LoginFormState,
  LoginStatusState,
} from '../../features/auth/types/login.types';

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
        message: 'Google auth preview complete (FIXTURE_ONLY)',
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
            message: 'Signed in successfully! (FIXTURE_ONLY)',
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

    if (form.otp !== loginFixture.defaultOtp && form.otp.length < 6) {
      setStatus({ type: 'error', message: 'Invalid OTP code. Use 123456 for demo.' });
      return;
    }
    setStatus({ type: 'loading' });
    setTimeout(() => {
      setStatus({
        type: 'success',
        message: 'Account created & verified! (FIXTURE_ONLY)',
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
      {/* Header Navigation */}
      <LoginHeaderNav
        onBack={handleBack}
        showBackButton={step !== 'credentials'}
      />

      {/* Main Responsive Grid Layout */}
      <main className="flex min-h-screen w-full flex-col md:flex-row">
        {/* Left Orange Branding Panel */}
        <LoginHeroPanel
          headline={loginFixture.hero.headline}
          tagline={loginFixture.hero.tagline}
        />

        {/* Right Dark Form Panel */}
        <section className="flex flex-1 items-center justify-center bg-black px-6 py-28 md:px-12 md:py-20">
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
      </main>
    </div>
  );
}

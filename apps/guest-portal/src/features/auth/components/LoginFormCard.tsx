'use client';

import React from 'react';

import { CitySelectorStep } from './CitySelectorStep';
import { OtpVerifyStep } from './OtpVerifyStep';
import { PhoneStep } from './PhoneStep';

import type {
  AuthMode,
  AuthStep,
  LoginFormState,
  LoginStatusState,
  CountryOption,
} from '../types/login.types';

export interface LoginFormCardProps {
  mode: AuthMode;
  step: AuthStep;
  form: LoginFormState;
  status: LoginStatusState;
  cities: string[];
  countries: CountryOption[];
  onFormChange: (field: keyof LoginFormState, value: string) => void;
  onNext: (e: React.SyntheticEvent) => void;
  onGoogleLogin: () => void;
  onToggleMode: () => void;
  onSetStep: (step: AuthStep) => void;
  onResendOtp: () => void;
}

export const LoginFormCard: React.FC<LoginFormCardProps> = ({
  mode,
  step,
  form,
  status,
  cities,
  countries,
  onFormChange,
  onNext,
  onGoogleLogin,
  onToggleMode,
  onSetStep,
  onResendOtp,
}) => {
  const isSubmitting = status.type === 'loading';

  const getHeading = () => {
    if (step === 'credentials') {
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4400] mb-2">
            MEMBER ACCESS
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none text-white">
            {mode === 'login' ? (
              <>
                WHAT&apos;S YOUR <br />
                <span className="text-[#FF4400]">EMAIL?</span>
              </>
            ) : (
              <>
                JOIN THE <br />
                <span className="text-[#FF4400]">C1RCLE.</span>
              </>
            )}
          </h2>
        </>
      );
    }
    if (step === 'phone') {
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4400] mb-2">
            STEP 2 OF 6
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none text-white">
            YOUR <br />
            <span className="text-[#FF4400]">PHONE?</span>
          </h2>
        </>
      );
    }
    if (step === 'name') {
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4400] mb-2">
            STEP 3 OF 6
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none text-white">
            WHAT&apos;S YOUR <br />
            <span className="text-[#FF4400]">NAME?</span>
          </h2>
        </>
      );
    }
    if (step === 'age') {
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4400] mb-2">
            STEP 4 OF 6
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none text-white">
            WHAT&apos;S YOUR <br />
            <span className="text-[#FF4400]">AGE?</span>
          </h2>
        </>
      );
    }
    if (step === 'gender') {
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4400] mb-2">
            STEP 5 OF 6
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none text-white">
            HOW DO YOU <br />
            <span className="text-[#FF4400]">IDENTIFY?</span>
          </h2>
        </>
      );
    }
    if (step === 'city') {
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4400] mb-2">
            STEP 6 OF 6
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none text-white">
            YOUR <br />
            <span className="text-[#FF4400]">CITY?</span>
          </h2>
        </>
      );
    }
    return (
      <>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4400] mb-2">
          SECURITY VERIFICATION
        </p>
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none text-white">
          VERIFY YOUR <br />
          <span className="text-[#FF4400]">PHONE.</span>
        </h2>
      </>
    );
  };

  const stepsList: AuthStep[] = ['credentials', 'phone', 'name', 'age', 'gender', 'city', 'verify_otp'];
  const currentStepIndex = stepsList.indexOf(step);

  return (
    <div className="w-full max-w-[420px] space-y-6">
      {/* Dynamic Heading */}
      <div className="text-left">{getHeading()}</div>

      {/* Main Glassmorphism Form Card */}
      <div className="relative flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-black/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <form onSubmit={onNext} className="space-y-6">
          {/* STEP 1: CREDENTIALS */}
          {step === 'credentials' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email-input" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 block">
                  EMAIL ADDRESS
                </label>
                <input
                  id="email-input"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={form.email}
                  onChange={(e) => {
                    onFormChange('email', e.target.value);
                  }}
                  placeholder="NAME@EMAIL.COM"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF4400]/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password-input" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 block">
                  PASSWORD
                </label>
                <input
                  id="password-input"
                  type="password"
                  required
                  minLength={8}
                  disabled={isSubmitting}
                  value={form.password}
                  onChange={(e) => {
                    onFormChange('password', e.target.value);
                  }}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF4400]/50 transition-all"
                />
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                    At least 8 characters
                  </span>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        onFormChange('email', form.email);
                      }}
                      className="text-[9px] font-bold text-[#FF4400]/70 hover:text-[#FF4400] uppercase tracking-widest transition-colors"
                    >
                      FORGOT PASSWORD?
                    </button>
                  )}
                </div>
              </div>

              {/* Google Login CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white text-black font-black uppercase tracking-[0.25em] text-[10px] hover:bg-white/90 transition-all shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  CONTINUE WITH GOOGLE
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PHONE */}
          {step === 'phone' && (
            <PhoneStep
              countries={countries}
              selectedCountry={form.country}
              phone={form.phone}
              onCountryChange={(code) => {
                onFormChange('country', code);
              }}
              onPhoneChange={(val) => {
                onFormChange('phone', val);
              }}
              disabled={isSubmitting}
            />
          )}

          {/* STEP 3: NAME */}
          {step === 'name' && (
            <div className="space-y-2">
              <label htmlFor="name-input" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 block">
                FULL NAME
              </label>
              <input
                id="name-input"
                type="text"
                required
                disabled={isSubmitting}
                value={form.name}
                onChange={(e) => {
                  onFormChange('name', e.target.value);
                }}
                placeholder="YOUR FULL NAME"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF4400]/50"
              />
            </div>
          )}

          {/* STEP 4: AGE */}
          {step === 'age' && (
            <div className="space-y-2">
              <label htmlFor="age-input" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 block">
                AGE
              </label>
              <input
                id="age-input"
                type="number"
                min="18"
                max="100"
                required
                disabled={isSubmitting}
                value={form.age}
                onChange={(e) => {
                  onFormChange('age', e.target.value);
                }}
                placeholder="e.g. 24"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF4400]/50"
              />
            </div>
          )}

          {/* STEP 5: GENDER / IDENTITY */}
          {step === 'gender' && (
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 block">
                GENDER IDENTITY
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Non-binary'].map((g) => (
                  <button
                    type="button"
                    key={g}
                    disabled={isSubmitting}
                    onClick={() => {
                      onFormChange('gender', g);
                    }}
                    className={`h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                      form.gender === g
                        ? 'bg-[#FF4400] text-white border-[#FF4400]'
                        : 'bg-white/[0.04] text-white/70 border-white/10 hover:border-[#FF4400]/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: CITY */}
          {step === 'city' && (
            <CitySelectorStep
              cities={cities}
              selectedCity={form.city}
              onSelectCity={(c) => {
                onFormChange('city', c);
              }}
              disabled={isSubmitting}
            />
          )}

          {/* STEP 7: OTP VERIFICATION */}
          {step === 'verify_otp' && (
            <OtpVerifyStep
              phone={form.phone}
              otp={form.otp}
              onOtpChange={(val) => {
                onFormChange('otp', val);
              }}
              onResend={onResendOtp}
              onEditPhone={() => {
                onSetStep('phone');
              }}
              disabled={isSubmitting}
            />
          )}

          {/* Error Message */}
          {status.message && (
            <p className="text-[10px] font-black text-[#FF4400] text-center uppercase tracking-[0.2em] bg-[#FF4400]/10 py-3 px-4 rounded-xl border border-[#FF4400]/30">
              {status.message}
            </p>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/90 transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                PROCESSING...
              </span>
            ) : (
              <>
                CONTINUE
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </button>

          {/* Progress Indicator Pills */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {stepsList.map((st, i) => (
              <div
                key={st}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  i === currentStepIndex
                    ? 'w-7 bg-[#FF4400]'
                    : i < currentStepIndex
                    ? 'w-2 bg-white/40'
                    : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>
        </form>
      </div>

      {/* Mode Toggle (Login vs Create Account) */}
      {step === 'credentials' && (
        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            disabled={isSubmitting}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors"
          >
            {mode === 'login' ? (
              <>
                NEW HERE?{' '}
                <span className="text-[#FF4400] underline underline-offset-4">
                  CREATE ACCOUNT
                </span>
              </>
            ) : (
              <>
                ALREADY HAVE AN ACCOUNT?{' '}
                <span className="text-[#FF4400] underline underline-offset-4">
                  LOG IN
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

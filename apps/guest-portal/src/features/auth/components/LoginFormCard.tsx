'use client';

import Link from 'next/link';
import React from 'react';

import { CitySelectorStep } from './CitySelectorStep';
import { OtpVerifyStep } from './OtpVerifyStep';
import { PhoneStep } from './PhoneStep';

import type {
  AuthProviderPreview,
  AuthStep,
  LoginFixtureData,
  LoginFormState,
  LoginStatusState,
} from '../types/login.types';

interface LoginFormCardProps {
  step: AuthStep;
  form: LoginFormState;
  status: LoginStatusState;
  fixture: LoginFixtureData;
  onProvider: (provider: Exclude<AuthProviderPreview, null>) => void;
  onFormChange: (field: keyof LoginFormState, value: string | string[]) => void;
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  onToggleChoice: (field: 'tastes' | 'intents', value: string) => void;
  onEditPhone: () => void;
  onResendOtp: () => void;
  onRestart: () => void;
}

const headings: Record<
  AuthStep,
  { eyebrow: string; title: string; accent: string; subtitle: string }
> = {
  methods: {
    eyebrow: 'MEMBER ACCESS',
    title: 'STEP INTO',
    accent: 'THE C1RCLE.',
    subtitle: 'Choose how you want to continue.',
  },
  phone: {
    eyebrow: 'PHONE · STEP 01',
    title: "WHAT'S YOUR",
    accent: 'NUMBER?',
    subtitle: 'Enter your number to continue.',
  },
  verify_otp: {
    eyebrow: 'PHONE · STEP 02',
    title: 'ENTER YOUR',
    accent: 'CODE.',
    subtitle: 'Enter the six-digit verification code.',
  },
  identity: {
    eyebrow: 'ONBOARDING · 01 OF 04',
    title: 'WHAT SHOULD WE',
    accent: 'CALL YOU?',
    subtitle: 'Your name and age help shape your guest profile.',
  },
  city: {
    eyebrow: 'ONBOARDING · 02 OF 04',
    title: 'WHERE ARE YOU',
    accent: 'GOING OUT?',
    subtitle: 'Choose the city you want to discover first.',
  },
  tastes: {
    eyebrow: 'ONBOARDING · 03 OF 04',
    title: 'WHAT KIND OF',
    accent: 'NIGHTS?',
    subtitle: 'Pick at least three.',
  },
  intent: {
    eyebrow: 'ONBOARDING · 04 OF 04',
    title: 'WHAT BRINGS YOU',
    accent: 'HERE?',
    subtitle: 'Choose one or more.',
  },
  complete: {
    eyebrow: 'WELCOME IN',
    title: "YOU'RE READY TO",
    accent: 'EXPLORE.',
    subtitle: 'Your preferences are set.',
  },
};

function AppleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c-.02-2.38 1.95-3.54 2.04-3.6a4.39 4.39 0 0 0-3.45-1.87c-1.45-.15-2.86.87-3.6.87-.75 0-1.88-.85-3.1-.83a4.58 4.58 0 0 0-3.86 2.35c-1.67 2.89-.43 7.14 1.17 9.48.8 1.14 1.73 2.42 2.95 2.37 1.2-.05 1.65-.76 3.1-.76 1.43 0 1.86.76 3.12.73 1.29-.02 2.1-1.15 2.87-2.3a9.4 9.4 0 0 0 1.31-2.68 4.13 4.13 0 0 1-2.55-3.76ZM14.7 5.53a4.2 4.2 0 0 0 .96-3.03 4.27 4.27 0 0 0-2.78 1.44 4.02 4.02 0 0 0-.99 2.92 3.53 3.53 0 0 0 2.81-1.33Z" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.62 6.62 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.08H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84A6.56 6.56 0 0 1 12 5.38Z"
      />
    </svg>
  );
}

function ChoiceGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              onToggle(option);
            }}
            className={`min-h-16 rounded-2xl border px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] transition-colors ${
              isSelected
                ? 'border-[#FF4400] bg-[#FF4400] text-white shadow-[0_10px_30px_rgba(255,68,0,0.2)]'
                : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-[#FF4400]/50 hover:text-white'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function LoginFormCard({
  step,
  form,
  status,
  fixture,
  onProvider,
  onFormChange,
  onSubmit,
  onToggleChoice,
  onEditPhone,
  onResendOtp,
  onRestart,
}: LoginFormCardProps) {
  const heading = headings[step];
  const selectedCountry = fixture.supportedCountries.find(
    (country) => country.code === form.country,
  );
  const fullPhone = `${selectedCountry?.dialCode ?? ''} ${form.phone}`.trim();
  const submitLabel: Partial<Record<AuthStep, string>> = {
    phone: 'SEND DEMO CODE',
    verify_otp: 'VERIFY PREVIEW',
    identity: 'CONTINUE',
    city: 'CONTINUE',
    tastes: 'CONTINUE',
    intent: 'FINISH PREVIEW',
  };

  return (
    <div className="w-full max-w-[460px] space-y-6">
      <div className="text-left">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4400]">
          {heading.eyebrow}
        </p>
        <h1
          aria-label={`${heading.title} ${heading.accent}`}
          className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-white sm:text-5xl"
        >
          {heading.title}
          <br />
          <span className="text-[#FF4400]">{heading.accent}</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/50">{heading.subtitle}</p>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#080808]/90 p-7 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-9">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {step === 'methods' ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                onProvider('apple');
              }}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-xs font-black uppercase tracking-[0.18em] text-black transition-transform hover:-translate-y-0.5"
            >
              <AppleMark />
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={() => {
                onProvider('google');
              }}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-xs font-black uppercase tracking-[0.18em] text-black transition-transform hover:-translate-y-0.5"
            >
              <GoogleMark />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => {
                onProvider('phone');
              }}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#FF4400]/60 hover:bg-[#FF4400]/10"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h4"
                />
              </svg>
              Continue with phone number
            </button>
            <div className="flex items-center gap-3 py-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">
                OR
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <Link
              href="/explore"
              className="flex h-12 w-full items-center justify-center text-[10px] font-black uppercase tracking-[0.22em] text-white/55 transition-colors hover:text-[#FF4400]"
            >
              Explore as guest →
            </Link>
          </div>
        ) : step === 'complete' ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#FF4400]/40 bg-[#FF4400]/10 text-[#FF4400]">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="m5 12 4 4L19 6"
                />
              </svg>
            </div>
            <p className="text-sm leading-6 text-white/60">
              Your profile is ready for the nights you want to discover.
            </p>
            <Link
              href="/explore"
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#FF4400] text-xs font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ff5b1f]"
            >
              Explore events
            </Link>
            <button
              type="button"
              onClick={onRestart}
              className="h-11 text-[10px] font-black uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
            >
              Start over
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            {step === 'phone' && (
              <PhoneStep
                countries={fixture.supportedCountries}
                selectedCountry={form.country}
                phone={form.phone}
                onCountryChange={(value) => {
                  onFormChange('country', value);
                }}
                onPhoneChange={(value) => {
                  onFormChange('phone', value);
                }}
              />
            )}

            {step === 'verify_otp' && (
              <OtpVerifyStep
                phone={fullPhone}
                otp={form.otp}
                onOtpChange={(value) => {
                  onFormChange('otp', value);
                }}
                onResend={onResendOtp}
                onEditPhone={onEditPhone}
              />
            )}

            {step === 'identity' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="preferred-name"
                    className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/65"
                  >
                    Preferred name
                  </label>
                  <input
                    id="preferred-name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => {
                      onFormChange('name', event.target.value);
                    }}
                    placeholder="WHAT SHOULD WE CALL YOU?"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-bold tracking-widest text-white placeholder:text-white/25 focus:border-[#FF4400]/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="date-of-birth"
                    className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/65"
                  >
                    Date of birth
                  </label>
                  <input
                    id="date-of-birth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => {
                      onFormChange('dateOfBirth', event.target.value);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-bold uppercase tracking-widest text-white [color-scheme:dark] focus:border-[#FF4400]/60 focus:outline-none"
                  />
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                    You must be 18 or older.
                  </p>
                </div>
              </div>
            )}

            {step === 'city' && (
              <CitySelectorStep
                cities={fixture.availableCities}
                selectedCity={form.city}
                onSelectCity={(value) => {
                  onFormChange('city', value);
                }}
              />
            )}

            {step === 'tastes' && (
              <ChoiceGrid
                options={fixture.tasteOptions}
                selected={form.tastes}
                onToggle={(value) => {
                  onToggleChoice('tastes', value);
                }}
              />
            )}

            {step === 'intent' && (
              <ChoiceGrid
                options={fixture.intentOptions}
                selected={form.intents}
                onToggle={(value) => {
                  onToggleChoice('intents', value);
                }}
              />
            )}

            {status.message && (
              <p
                role={status.type === 'error' ? 'alert' : 'status'}
                className={`rounded-xl border px-4 py-3 text-[10px] font-bold uppercase leading-5 tracking-[0.14em] ${
                  status.type === 'error'
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-[#FF4400]/25 bg-[#FF4400]/[0.08] text-[#FF8A5C]'
                }`}
              >
                {status.message}
              </p>
            )}

            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#FF4400] text-xs font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ff5b1f]"
            >
              {submitLabel[step] ?? 'Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

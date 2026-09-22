'use client';

import Link from 'next/link';
import React from 'react';

import { CitySelectorStep } from './CitySelectorStep';
import { OtpVerifyStep } from './OtpVerifyStep';

import type {
  AuthMode,
  AuthStep,
  LoginFixtureData,
  LoginFormState,
  LoginStatusState,
} from '../types/login.types';

interface LoginFormCardProps {
  mode: AuthMode;
  step: AuthStep;
  form: LoginFormState;
  status: LoginStatusState;
  loading: boolean;
  fixture: LoginFixtureData;
  onModeChange: (mode: AuthMode) => void;
  onFormChange: (field: keyof LoginFormState, value: string) => void;
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  onToggleChoice: (field: 'tastes' | 'intents', value: string) => void;
  onEditCredentials: () => void;
  onResendOtp: () => void;
  onRestart: () => void;
}

function headingFor(mode: AuthMode, step: AuthStep) {
  switch (step) {
    case 'verify_otp':
      return {
        eyebrow: 'VERIFY · STEP 02',
        title: 'ENTER YOUR',
        accent: 'CODE.',
        subtitle: 'Enter the six-digit verification code.',
      };
    case 'identity':
      return {
        eyebrow: 'ONBOARDING · 01 OF 04',
        title: 'WHAT SHOULD WE',
        accent: 'CALL YOU?',
        subtitle: 'Your name and age help shape your guest profile.',
      };
    case 'city':
      return {
        eyebrow: 'ONBOARDING · 02 OF 04',
        title: 'WHERE ARE YOU',
        accent: 'GOING OUT?',
        subtitle: 'Choose the city you want to discover first.',
      };
    case 'tastes':
      return {
        eyebrow: 'ONBOARDING · 03 OF 04',
        title: 'WHAT KIND OF',
        accent: 'NIGHTS?',
        subtitle: 'Pick at least three.',
      };
    case 'intent':
      return {
        eyebrow: 'ONBOARDING · 04 OF 04',
        title: 'WHAT BRINGS YOU',
        accent: 'HERE?',
        subtitle: 'Choose one or more.',
      };
    case 'complete':
      return {
        eyebrow: 'WELCOME IN',
        title: "YOU'RE READY TO",
        accent: 'EXPLORE.',
        subtitle: 'Your account is ready for the nights you want to discover.',
      };
    case 'credentials':
    default:
      if (mode === 'signup') {
        return {
          eyebrow: 'MEMBER ACCESS · SIGN UP',
          title: 'JOIN',
          accent: 'THE C1RCLE.',
          subtitle: 'Create your account with email and password.',
        };
      }
      return {
        eyebrow: 'MEMBER ACCESS · LOGIN',
        title: 'WELCOME',
        accent: 'BACK.',
        subtitle: 'Sign in with your email and password.',
      };
  }
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
  mode,
  step,
  form,
  status,
  loading,
  fixture,
  onModeChange,
  onFormChange,
  onSubmit,
  onToggleChoice,
  onEditCredentials,
  onResendOtp,
  onRestart,
}: LoginFormCardProps) {
  const heading = headingFor(mode, step);
  const submitLabel =
    step === 'credentials'
      ? 'CONTINUE'
      : step === 'verify_otp'
        ? 'VERIFY & CONTINUE'
        : step === 'intent'
          ? 'FINISH'
          : 'CONTINUE';

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

        {step === 'complete' ? (
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
              {mode === 'signup'
                ? 'Your account is created. Time to find your first night out.'
                : 'You are signed in. Time to find your next night out.'}
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
            {step === 'credentials' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email-address"
                    className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/65"
                  >
                    Email address
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                    value={form.email}
                    onChange={(event) => {
                      onFormChange('email', event.target.value);
                    }}
                    placeholder="YOU@EXAMPLE.COM"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-bold tracking-widest text-white placeholder:text-white/25 focus:border-[#FF4400]/60 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/65"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    disabled={loading}
                    value={form.password}
                    onChange={(event) => {
                      onFormChange('password', event.target.value);
                    }}
                    placeholder={mode === 'signup' ? 'MIN. 8 CHARACTERS' : 'YOUR PASSWORD'}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-bold tracking-widest text-white placeholder:text-white/25 focus:border-[#FF4400]/60 focus:outline-none disabled:opacity-50"
                  />
                  {mode === 'signup' && (
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                      Minimum 8 characters.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                  {mode === 'login' ? (
                    <>
                      <span className="text-white/40">New here?</span>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          onModeChange('signup');
                        }}
                        className="text-[#FF4400] hover:underline disabled:opacity-50"
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-white/40">Already a member?</span>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          onModeChange('login');
                        }}
                        className="text-[#FF4400] hover:underline disabled:opacity-50"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 'verify_otp' && (
              <OtpVerifyStep
                phone={form.email}
                otp={form.otp}
                onOtpChange={(value) => {
                  onFormChange('otp', value);
                }}
                onResend={onResendOtp}
                onEditPhone={onEditCredentials}
                disabled={loading}
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
                    disabled={loading}
                    value={form.name}
                    onChange={(event) => {
                      onFormChange('name', event.target.value);
                    }}
                    placeholder="WHAT SHOULD WE CALL YOU?"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-bold tracking-widest text-white placeholder:text-white/25 focus:border-[#FF4400]/60 focus:outline-none disabled:opacity-50"
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
                    disabled={loading}
                    value={form.dateOfBirth}
                    onChange={(event) => {
                      onFormChange('dateOfBirth', event.target.value);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-bold uppercase tracking-widest text-white [color-scheme:dark] focus:border-[#FF4400]/60 focus:outline-none disabled:opacity-50"
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
                disabled={loading}
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
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#FF4400] text-xs font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ff5b1f] disabled:opacity-50"
            >
              {loading ? 'PLEASE WAIT…' : submitLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

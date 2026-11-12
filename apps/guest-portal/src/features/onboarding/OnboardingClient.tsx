'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';

import { guestDestination } from '@/lib/auth/continue-path';
import { restoreGuestReturnFragment } from '@/lib/auth/return-fragment';

import { AuthShell, authButtonClass, authInputClass } from '../auth/components/AuthShell';

import { readOnboarding, saveOnboarding, verifyOnboardingPhone } from './client';
import {
  clearPhoneChallenge,
  confirmPhoneCode,
  phoneAuthErrorMessage,
  requestPhoneCode,
} from './phone';

import type { PhoneConfirmation } from './phone';
import type { GuestOnboardingState } from '@c1rcle/contracts/guest-onboarding';

export function OnboardingClient({ initialName }: { readonly initialName: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const destination = guestDestination(params.get('next'));
  const [state, setState] = useState<GuestOnboardingState | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [tastes, setTastes] = useState<string[]>([]);
  const [hasChallenge, setHasChallenge] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const confirmation = useRef<PhoneConfirmation | null>(null);
  const sentPhone = useRef('');
  const applySaved = useCallback(
    (saved: GuestOnboardingState) => {
      setState(saved);
      setName(saved.displayName || initialName);
      setDob(saved.dateOfBirth);
      setPhone(saved.phoneNumber ?? '');
      setTastes(saved.tastes);
      if (saved.complete) {
        router.replace(restoreGuestReturnFragment(destination));
        return;
      }
      setStep(!saved.displayName ? 0 : !saved.dateOfBirth ? 1 : !saved.phoneVerified ? 2 : 3);
    },
    [initialName, router, destination],
  );
  async function load() {
    setError(null);
    try {
      applySaved(await readOnboarding());
    } catch {
      setError('Your progress could not be loaded. Please try again.');
    }
  }
  useEffect(() => {
    let active = true;
    void readOnboarding()
      .then((saved) => {
        if (active) applySaved(saved);
      })
      .catch(() => {
        if (active) setError('Your progress could not be loaded. Please try again.');
      });
    return () => {
      active = false;
      clearPhoneChallenge();
    };
  }, [applySaved]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((value) => value - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [cooldown]);
  async function send() {
    if (pending || cooldown > 0) return;
    setPending(true);
    setError(null);
    try {
      confirmation.current = await requestPhoneCode(phone);
      setHasChallenge(true);
      sentPhone.current = phone;
      setCode('');
      setCooldown(60);
    } catch (error) {
      setError(phoneAuthErrorMessage(error, 'send'));
    } finally {
      setPending(false);
    }
  }
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      if (step === 0) await saveOnboarding({ displayName: name });
      if (step === 1) await saveOnboarding({ dateOfBirth: dob });
      if (step === 2) {
        if (!(state?.phoneVerified && phone === state.phoneNumber)) {
          if (!confirmation.current || sentPhone.current !== phone)
            throw new Error('Request a code for this phone number first.');
          const proof = await confirmPhoneCode(confirmation.current, code);
          await verifyOnboardingPhone(phone, proof);
        }
      }
      if (step === 3) {
        await saveOnboarding({ tastes });
        const saved = await readOnboarding();
        if (!saved.complete) throw new Error('Complete the remaining steps first.');
        router.replace(restoreGuestReturnFragment(guestDestination(params.get('next'))));
        router.refresh();
        return;
      }
      const saved = await readOnboarding();
      setState(saved);
      setStep((value) => value + 1);
    } catch (error) {
      setError(
        step === 2
          ? phoneAuthErrorMessage(error, 'verify')
          : 'Your details could not be saved. Check them and try again.',
      );
    } finally {
      setPending(false);
    }
  }
  const titles = [
    'What should we call you?',
    'When is your birthday?',
    'Verify your phone',
    'What are you into?',
  ];
  return (
    <AuthShell eyebrow={`Step ${String(step + 1)} of 4`} title={titles[step] ?? 'Welcome'}>
      {!state ? (
        <>
          <p className="text-sm text-white/70">{error ?? 'Loading your progress…'}</p>
          {error && (
            <button
              onClick={() => {
                void load();
              }}
              className={authButtonClass}
            >
              Try again
            </button>
          )}
        </>
      ) : (
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
          className="space-y-5"
        >
          {step === 0 && (
            <label className="block text-sm text-white/70">
              Your name
              <input
                required
                minLength={2}
                maxLength={200}
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                className={authInputClass}
              />
            </label>
          )}
          {step === 1 && (
            <>
              <label className="block text-sm text-white/70">
                Date of birth
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(event) => {
                    setDob(event.target.value);
                  }}
                  className={authInputClass}
                />
              </label>
              <p className="text-sm text-white/55">
                Your birthday stays private. You must be 18 or older.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-sm text-white/70">Stay updated about your events.</p>
              <label className="block text-sm text-white/70">
                Phone number
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\s/g, ''));
                    confirmation.current = null;
                    setHasChallenge(false);
                    setCode('');
                  }}
                  className={authInputClass}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  void send();
                }}
                disabled={pending || cooldown > 0}
                className="text-sm text-white underline"
              >
                {cooldown > 0
                  ? `Resend in ${String(cooldown)}s`
                  : hasChallenge
                    ? 'Resend code'
                    : 'Send code'}
              </button>
              {hasChallenge && (
                <label className="block text-sm text-white/70">
                  Verification code
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value);
                    }}
                    className={authInputClass}
                  />
                </label>
              )}
              <div id="guest-phone-challenge" />
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-sm text-white/70">Choose at least one.</p>
              <div className="flex flex-wrap gap-2">
                {state.interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    aria-pressed={tastes.includes(interest)}
                    onClick={() => {
                      setTastes((values) =>
                        values.includes(interest)
                          ? values.filter((value) => value !== interest)
                          : [...values, interest],
                      );
                    }}
                    className={`rounded-full border px-4 py-3 text-sm ${tastes.includes(interest) ? 'border-white bg-white text-black' : 'border-white/25 text-white'}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            className={authButtonClass}
            disabled={pending || (step === 3 && tastes.length === 0)}
          >
            {pending ? 'Saving…' : step === 3 ? 'Finish' : 'Continue'}
          </button>
          {step > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setStep((value) => value - 1);
              }}
              className="text-sm text-white/70 underline"
            >
              Back
            </button>
          )}
        </form>
      )}
    </AuthShell>
  );
}

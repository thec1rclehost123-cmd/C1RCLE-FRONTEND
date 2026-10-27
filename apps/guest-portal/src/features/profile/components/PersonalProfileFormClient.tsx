'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import { guestProfileDtoSchema, upsertGuestProfileSchema } from '@c1rcle/contracts';
import { Button } from '@c1rcle/ui';

import { csrfHeaders } from '@/lib/bff/csrf';

import type { ProfileIdentity } from '../types/profile.types';
import type { UpsertGuestProfileRequest } from '@c1rcle/contracts';

type RetainedProfileFields = Pick<UpsertGuestProfileRequest, 'dateOfBirth' | 'tastes' | 'intents'>;
type PersonalProfileDraft = Pick<
  UpsertGuestProfileRequest,
  'displayName' | 'city' | 'dateOfBirth'
> & {
  tastes: string;
  intents: string;
};

const profileClient = createApiClient({
  baseUrl: typeof window === 'undefined' ? '' : window.location.origin,
});

const inputClass =
  'mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-sm font-bold text-white outline-none transition-colors focus:border-[#FF4400]';

export function PersonalProfileFormClient({
  identity,
  profileFields,
}: {
  identity: ProfileIdentity;
  profileFields: RetainedProfileFields;
}) {
  const router = useRouter();
  const initialDraft = useMemo<PersonalProfileDraft>(
    () => ({
      displayName: identity.displayName,
      city: identity.city ?? '',
      dateOfBirth: profileFields.dateOfBirth,
      tastes: profileFields.tastes.join(', '),
      intents: profileFields.intents.join(', '),
    }),
    [identity.city, identity.displayName, profileFields],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [savedDraft, setSavedDraft] = useState(initialDraft);
  const [nameError, setNameError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const isDirty = (Object.keys(draft) as (keyof PersonalProfileDraft)[]).some(
    (key) => draft[key] !== savedDraft[key],
  );

  function validateName(value: string): string | null {
    return value.trim().length < 2 ? 'Enter at least two characters.' : null;
  }

  function validateCity(value: string): string | null {
    if (value.trim().length === 0) return 'Enter a city.';
    return value.trim().length > 100 ? 'City must be 100 characters or fewer.' : null;
  }

  async function saveProfile() {
    const nextNameError = validateName(draft.displayName);
    const nextCityError = validateCity(draft.city);
    setNameError(nextNameError);
    setCityError(nextCityError);
    setSaveError(null);
    setSaved(false);
    if (nextNameError !== null || nextCityError !== null) return;

    const parsed = upsertGuestProfileSchema.safeParse({
      displayName: draft.displayName.trim(),
      city: draft.city.trim(),
      dateOfBirth: draft.dateOfBirth,
      tastes: draft.tastes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      intents: draft.intents
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
    if (!parsed.success) {
      setSaveError(
        'Check your date of birth, enter at least three interests, and add one reason for joining.',
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await profileClient.put({
        path: '/api/profile/me',
        body: parsed.data,
        headers: csrfHeaders(),
        schema: guestProfileDtoSchema,
      });
      const nextDraft = {
        displayName: updated.displayName,
        city: updated.city,
        dateOfBirth: updated.dateOfBirth,
        tastes: updated.tastes.join(', '),
        intents: updated.intents.join(', '),
      };
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      setSaved(true);
      router.refresh();
    } catch (error) {
      setSaveError(
        isApiClientError(error) && error.status === 401
          ? 'Your session expired. Sign in again to update your profile.'
          : 'Your profile could not be saved. Check your connection and try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function resetChanges() {
    setDraft(savedDraft);
    setNameError(null);
    setCityError(null);
    setSaveError(null);
    setSaved(false);
  }

  return (
    <section
      aria-label="Personal profile"
      className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7"
    >
      <div className="flex items-center gap-5 border-b border-white/10 pb-7">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#FF4400]/40 bg-[#FF4400] text-2xl font-black text-white">
          {identity.avatarUrl ? (
            <Image
              src={identity.avatarUrl}
              alt="Current profile photo"
              fill
              unoptimized
              sizes="80px"
              className="object-cover"
            />
          ) : (
            identity.initials
          )}
        </div>
        <p className="max-w-lg text-sm leading-6 text-white/55">
          Profile photo uploads are not available yet. Your saved photo is shown here when one
          exists.
        </p>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            Full name
          </span>
          <input
            name="name"
            autoComplete="name"
            value={draft.displayName}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? 'profile-name-error' : undefined}
            className={inputClass}
            onChange={(event) => {
              const value = event.target.value;
              setDraft((current) => ({ ...current, displayName: value }));
              setNameError(null);
              setSaveError(null);
              setSaved(false);
            }}
            onBlur={() => {
              setNameError(validateName(draft.displayName));
            }}
          />
          {nameError && (
            <span id="profile-name-error" className="mt-2 block text-xs text-red-300">
              {nameError}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            City
          </span>
          <input
            name="address-level2"
            autoComplete="address-level2"
            value={draft.city}
            aria-invalid={Boolean(cityError)}
            aria-describedby={cityError ? 'profile-city-error' : undefined}
            className={inputClass}
            onChange={(event) => {
              const value = event.target.value;
              setDraft((current) => ({ ...current, city: value }));
              setCityError(null);
              setSaveError(null);
              setSaved(false);
            }}
            onBlur={() => {
              setCityError(validateCity(draft.city));
            }}
          />
          {cityError && (
            <span id="profile-city-error" className="mt-2 block text-xs text-red-300">
              {cityError}
            </span>
          )}
        </label>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            Date of birth
          </span>
          <input
            type="date"
            autoComplete="bday"
            value={draft.dateOfBirth}
            className={inputClass}
            onChange={(event) => {
              setDraft((current) => ({ ...current, dateOfBirth: event.target.value }));
              setSaved(false);
            }}
          />
        </label>
        <label className="block">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            Interests
          </span>
          <input
            value={draft.tastes}
            className={inputClass}
            aria-describedby="profile-interests-help"
            onChange={(event) => {
              setDraft((current) => ({ ...current, tastes: event.target.value }));
              setSaved(false);
            }}
          />
          <span id="profile-interests-help" className="mt-1 block text-xs text-white/40">
            Separate at least three interests with commas.
          </span>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            What brings you here
          </span>
          <input
            value={draft.intents}
            className={inputClass}
            aria-describedby="profile-intents-help"
            onChange={(event) => {
              setDraft((current) => ({ ...current, intents: event.target.value }));
              setSaved(false);
            }}
          />
          <span id="profile-intents-help" className="mt-1 block text-xs text-white/40">
            Separate multiple reasons with commas.
          </span>
        </label>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="text-sm">
          {saveError && (
            <p role="alert" className="text-red-300">
              {saveError}
            </p>
          )}
          {saved && (
            <p role="status" className="text-emerald-300">
              Profile updated.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={!isDirty || saving}
            onClick={resetChanges}
          >
            Reset changes
          </Button>
          <Button type="button" disabled={!isDirty || saving} onClick={() => void saveProfile()}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </section>
  );
}

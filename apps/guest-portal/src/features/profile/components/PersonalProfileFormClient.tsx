'use client';

import { useEffect, useMemo, useState } from 'react';

import type { ProfileIdentity } from '../types/profile.types';

interface PersonalProfileDraft {
  displayName: string;
  city: string;
  instagram: string;
  phoneNumber: string;
  gender: string;
}

function createDraft(identity: ProfileIdentity): PersonalProfileDraft {
  return {
    displayName: identity.displayName,
    city: identity.city,
    instagram: identity.instagram,
    phoneNumber: identity.phoneNumber,
    gender: identity.gender,
  };
}

export function PersonalProfileFormClient({ identity }: { identity: ProfileIdentity }) {
  const [draft, setDraft] = useState(() => createDraft(identity));
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    avatar?: string;
    displayName?: string;
    phoneNumber?: string;
  }>({});
  const initialDraft = useMemo(() => createDraft(identity), [identity]);
  const isDirty = avatarPreview !== null || JSON.stringify(draft) !== JSON.stringify(initialDraft);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const updateField = (field: keyof PersonalProfileDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const validateName = () => {
    setErrors((current) => {
      const next = { ...current };
      if (draft.displayName.trim().length < 2) {
        next.displayName = 'Enter at least two characters.';
      } else {
        delete next.displayName;
      }
      return next;
    });
  };

  const validatePhone = () => {
    const digits = draft.phoneNumber.replace(/\D/g, '');
    setErrors((current) => {
      const next = { ...current };
      if (digits.length !== 10) {
        next.phoneNumber = 'Enter a 10-digit phone number.';
      } else {
        delete next.phoneNumber;
      }
      return next;
    });
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <div className="flex flex-col gap-6 border-b border-white/10 pb-7 sm:flex-row sm:items-center">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#FF4400]/40 bg-[#FF4400] text-2xl font-black text-white">
          {avatarPreview ? (
            // A local blob preview cannot be handled by the Next image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt="Selected profile preview"
              className="size-full object-cover"
            />
          ) : (
            identity.initials
          )}
        </div>
        <div>
          <label
            htmlFor="profile-avatar"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black"
          >
            Choose image
          </label>
          <input
            id="profile-avatar"
            type="file"
            accept="image/*"
            className="sr-only"
            aria-describedby={errors.avatar ? 'profile-avatar-error' : 'profile-avatar-help'}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!file.type.startsWith('image/')) {
                setErrors((current) => ({ ...current, avatar: 'Choose an image file.' }));
                event.target.value = '';
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                setErrors((current) => ({ ...current, avatar: 'Choose an image under 5 MB.' }));
                event.target.value = '';
                return;
              }
              if (avatarPreview) URL.revokeObjectURL(avatarPreview);
              setAvatarPreview(URL.createObjectURL(file));
              setErrors((current) => {
                const next = { ...current };
                delete next.avatar;
                return next;
              });
            }}
          />
          <p id="profile-avatar-help" className="mt-3 text-xs text-white/35">
            Square JPG, PNG or WebP · 5 MB max.
          </p>
          {errors.avatar && (
            <p id="profile-avatar-error" className="mt-2 text-xs text-red-300">
              {errors.avatar}
            </p>
          )}
        </div>
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
            onChange={(event) => {
              updateField('displayName', event.target.value);
            }}
            onBlur={validateName}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? 'profile-name-error' : undefined}
            className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-sm font-bold text-white outline-none transition-colors focus:border-[#FF4400]"
          />
          {errors.displayName && (
            <span id="profile-name-error" className="mt-2 block text-xs text-red-300">
              {errors.displayName}
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
            onChange={(event) => {
              updateField('city', event.target.value);
            }}
            className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-sm font-bold text-white outline-none transition-colors focus:border-[#FF4400]"
          />
        </label>

        <label className="block">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            Instagram
          </span>
          <div className="relative mt-2">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30">
              @
            </span>
            <input
              name="instagram"
              autoComplete="off"
              value={draft.instagram}
              onChange={(event) => {
                updateField('instagram', event.target.value);
              }}
              className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/50 pl-10 pr-5 text-sm font-bold text-white outline-none transition-colors focus:border-[#FF4400]"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            Phone number
          </span>
          <input
            name="tel"
            autoComplete="tel"
            inputMode="numeric"
            value={draft.phoneNumber}
            onChange={(event) => {
              updateField('phoneNumber', event.target.value);
            }}
            onBlur={validatePhone}
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={errors.phoneNumber ? 'profile-phone-error' : undefined}
            className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-sm font-bold text-white outline-none transition-colors focus:border-[#FF4400]"
          />
          {errors.phoneNumber && (
            <span id="profile-phone-error" className="mt-2 block text-xs text-red-300">
              {errors.phoneNumber}
            </span>
          )}
        </label>

        <label className="block sm:col-span-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
            Gender
          </span>
          <select
            name="gender"
            value={draft.gender}
            onChange={(event) => {
              updateField('gender', event.target.value);
            }}
            className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-sm font-bold text-white outline-none transition-colors focus:border-[#FF4400]"
          >
            <option>Woman</option>
            <option>Man</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
          </select>
        </label>
      </div>

      <div className="mt-7 flex justify-end border-t border-white/10 pt-6">
        <button
          type="button"
          disabled={!isDirty}
          onClick={() => {
            setDraft(initialDraft);
            setErrors({});
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
          }}
          className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/55 transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-white/55"
        >
          Reset changes
        </button>
      </div>
    </div>
  );
}

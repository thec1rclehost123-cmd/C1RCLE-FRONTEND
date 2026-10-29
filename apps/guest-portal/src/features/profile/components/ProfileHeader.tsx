import Image from 'next/image';
import Link from 'next/link';

import { EditIcon, SettingsIcon } from '@c1rcle/icons';

import type { ProfileIdentity } from '../types/profile.types';

export function ProfileHeader({
  identity,
  featured = true,
}: {
  identity: ProfileIdentity;
  featured?: boolean;
}) {
  const socialSettingsHref = '/profile?view=settings&section=social#social-links';

  return (
    <header
      className={`relative isolate mx-auto flex flex-col items-center justify-center px-2 text-center ${
        featured ? 'min-h-[50svh] pb-10 sm:pb-12' : 'min-h-[30svh] pb-8'
      }`}
    >
      {featured ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[-1rem] top-[-7rem] z-0 h-[34rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,68,0,0.24)_0%,rgba(255,68,0,0.08)_46%,transparent_72%)] blur-[44px] sm:top-[-9rem] sm:h-[40rem] sm:blur-[54px]"
        />
      ) : null}
      <Link
        href={socialSettingsHref}
        aria-label="Open profile settings"
        className="absolute right-1 top-1 z-10 inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/65 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-2 sm:top-2"
      >
        <SettingsIcon aria-hidden="true" size={19} strokeWidth={1.8} />
      </Link>
      {!featured ? (
        <Link
          href="/profile"
          className="absolute left-1 top-3 text-xs text-white/55 transition-colors hover:text-white"
        >
          ← Profile
        </Link>
      ) : null}
      <div
        className={`relative z-10 flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/[0.08] font-bold text-white shadow-[0_18px_70px_rgba(0,0,0,0.4)] ${featured ? 'size-36 text-4xl sm:size-48 sm:text-5xl lg:size-56' : 'size-24 text-2xl sm:size-28'}`}
      >
        {identity.avatarUrl ? (
          <Image
            src={identity.avatarUrl}
            alt={`${identity.displayName}'s profile photo`}
            fill
            unoptimized
            sizes="96px"
            className="object-cover"
          />
        ) : (
          identity.initials
        )}
      </div>
      <div className="relative z-10 mt-5 flex w-full max-w-full items-center justify-center">
        <h1 className="max-w-full break-words font-heading text-[clamp(1.85rem,8vw,3.5rem)] font-bold leading-tight tracking-[-0.045em] text-white">
          {identity.displayName}
        </h1>
        <Link
          href="/profile?view=settings&section=personal#profile-settings"
          aria-label="Edit profile name"
          className="absolute left-[calc(50%+min(42vw,12rem))] inline-flex size-9 -translate-x-1/2 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <EditIcon aria-hidden="true" size={16} strokeWidth={1.8} />
        </Link>
      </div>
      {identity.city ? (
        <p className="relative z-10 mt-1 text-sm text-white/55">{identity.city}</p>
      ) : null}
      <div className="relative z-10 mt-3 flex items-center gap-3">
        <Link
          href={socialSettingsHref}
          aria-label="Add Instagram profile link in settings"
          className="inline-flex size-12 items-center justify-center rounded-full text-[#E1306C] transition-colors hover:bg-[#E1306C]/10 hover:text-[#ff6f9f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="23"
            height="23"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect width="17" height="17" x="3.5" y="3.5" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
          </svg>
        </Link>
        <Link
          href={socialSettingsHref}
          aria-label="Add X profile link in settings"
          className="inline-flex size-12 items-center justify-center rounded-full text-[#1D9BF0] transition-colors hover:bg-[#1D9BF0]/10 hover:text-[#63baf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
            <path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.27L5.68 22H2.55l7.25-8.29L1.8 2h6.4l4.43 6.59L18.9 2Zm-1.1 18h1.73L7.27 3.9H5.42L17.8 20Z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

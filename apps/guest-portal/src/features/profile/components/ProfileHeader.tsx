import Image from 'next/image';
import Link from 'next/link';

import type { ProfileIdentity } from '../types/profile.types';

const joinedFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
});

export function ProfileHeader({ identity }: { identity: ProfileIdentity }) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-[#FF4400]/25 bg-[linear-gradient(125deg,rgba(255,68,0,0.18),rgba(11,11,11,0.96)_48%,rgba(116,57,160,0.15))] p-6 shadow-[0_28px_90px_rgba(255,68,0,0.12)] sm:p-9 lg:p-11">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#FF4400]/10 blur-[80px]" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#FF4400]/45 bg-[#FF4400] text-2xl font-black tracking-[-0.06em] text-white shadow-[0_0_38px_rgba(255,68,0,0.26)] sm:size-28 sm:text-3xl lg:size-32 lg:text-4xl">
            {identity.avatarUrl ? (
              <Image
                src={identity.avatarUrl}
                alt="Your profile photo"
                fill
                unoptimized
                sizes="128px"
                className="object-cover"
              />
            ) : (
              identity.initials
            )}
          </div>

          <div>
            <div className="mb-3 flex flex-wrap gap-2 sm:mb-4">
              {identity.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/65"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="max-w-[18ch] break-words text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.06em] text-white">
              {identity.displayName}
            </h1>
            {identity.city || identity.memberSince ? (
              <p className="mt-3 text-xs font-semibold text-white/55 sm:mt-4 sm:text-sm">
                {[
                  identity.city,
                  identity.memberSince
                    ? `Joined ${joinedFormatter.format(new Date(identity.memberSince))}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
        </div>

        <Link
          href="/profile?view=settings&section=personal#profile-settings"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-black transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:w-fit"
        >
          Edit profile
        </Link>
      </div>
    </header>
  );
}

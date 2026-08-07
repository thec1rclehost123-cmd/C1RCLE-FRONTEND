import Link from 'next/link';

import type { ProfileIdentity } from '../types/profile.types';

const joinedFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  year: 'numeric',
});

export function ProfileHeader({ identity }: { identity: ProfileIdentity }) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-[#FF4400]/25 bg-[linear-gradient(125deg,rgba(255,68,0,0.18),rgba(11,11,11,0.96)_48%,rgba(116,57,160,0.15))] p-6 shadow-[0_28px_90px_rgba(255,68,0,0.12)] sm:p-9 lg:p-11">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#FF4400]/15 blur-[90px]" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex size-28 shrink-0 items-center justify-center rounded-full border-2 border-[#FF4400]/45 bg-[#FF4400] text-3xl font-black tracking-[-0.06em] text-white shadow-[0_0_50px_rgba(255,68,0,0.32)] sm:size-36 sm:text-4xl">
            {identity.initials}
          </div>

          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {identity.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/65"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="text-5xl font-black uppercase leading-[0.86] tracking-[-0.065em] text-white sm:text-7xl">
              {identity.displayName}
            </h1>
            <p className="mt-4 text-sm font-semibold text-white/50">
              {identity.city} · Joined {joinedFormatter.format(new Date(identity.memberSince))}
            </p>
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

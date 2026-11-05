import Image from 'next/image';
import Link from 'next/link';

import { GuestSocialActions } from './GuestSocialActions';

import type { SocialGuestProfile } from '@c1rcle/contracts/guest-social';

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});
export function SocialProfileView({
  profile,
  isSelf,
}: {
  profile: SocialGuestProfile;
  isSelf: boolean;
}) {
  const { identity } = profile;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-28 text-white sm:pt-36">
      <Link href="/explore" className="inline-flex min-h-11 items-center text-sm text-white/60">
        ← Explore events
      </Link>
      <header className="mt-7 flex items-center gap-5">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF4400]/20 text-3xl font-bold">
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
            identity.displayName
              .split(/\s+/)
              .slice(0, 2)
              .map((name) => name[0])
              .join('')
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-[#FF6842]">In the C1RCLE</p>
          <h1 className="mt-2 break-words text-3xl font-bold sm:text-4xl">
            {identity.displayName}
          </h1>
        </div>
      </header>
      {identity.interests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-white/60">Their kind of night</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {identity.interests.map((interest) => (
              <li key={interest} className="rounded-full border border-white/15 px-4 py-2 text-sm">
                {interest}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Upcoming events</h2>
        {profile.upcomingEvents.length === 0 ? (
          <p className="mt-3 text-sm text-white/55">No upcoming events shared.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {profile.upcomingEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/event/${encodeURIComponent(event.slug)}`}
                  className="flex min-h-20 items-center justify-between gap-4 py-4"
                >
                  <span>
                    <span className="block font-semibold">{event.title}</span>
                    <span className="mt-1 block text-sm text-white/55">
                      {dateFormat.format(new Date(event.startAt))}
                    </span>
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      {!isSelf && <GuestSocialActions targetId={identity.id} />}
      {isSelf && (
        <Link
          href="/profile?view=settings&section=social"
          className="mt-8 inline-flex min-h-11 items-center text-sm underline"
        >
          Manage your privacy
        </Link>
      )}
    </div>
  );
}

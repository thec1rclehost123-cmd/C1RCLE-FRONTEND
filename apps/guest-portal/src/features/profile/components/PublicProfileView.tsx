import Link from 'next/link';

import { ProfileEventCard } from './ProfileEventCard';

import type {
  ProfileEventFilter,
  PublicProfileFixture,
  PublicProfileTone,
} from '../types/profile.types';

const joinedFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  year: 'numeric',
});

const toneClasses: Record<
  PublicProfileTone,
  { avatar: string; border: string; glow: string; label: string }
> = {
  orange: {
    avatar: 'bg-[#FF4D21]',
    border: 'border-[#FF4D21]/30',
    glow: 'shadow-[0_24px_100px_rgba(255,77,33,0.15)]',
    label: 'text-[#FF704D]',
  },
  purple: {
    avatar: 'bg-[#8C4DFF]',
    border: 'border-[#8C4DFF]/30',
    glow: 'shadow-[0_24px_100px_rgba(140,77,255,0.16)]',
    label: 'text-[#B98CFF]',
  },
  red: {
    avatar: 'bg-[#FF365F]',
    border: 'border-[#FF365F]/30',
    glow: 'shadow-[0_24px_100px_rgba(255,54,95,0.15)]',
    label: 'text-[#FF6F8D]',
  },
};

export function PublicProfileView({
  activeFilter,
  profile,
}: {
  activeFilter: ProfileEventFilter;
  profile: PublicProfileFixture;
}) {
  const { identity } = profile;
  const tone = toneClasses[identity.tone];
  const events = activeFilter === 'attended' ? profile.attendedEvents : profile.upcomingEvents;
  const allEvents = [...profile.upcomingEvents, ...profile.attendedEvents];
  const uniqueVenues = new Set(allEvents.map((event) => event.venue)).size;
  const profileHref = `/profile/${encodeURIComponent(identity.id)}`;

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip px-4 pb-24 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_50%_-10%,rgba(255,68,0,0.14),transparent_62%)]" />
      </div>

      <div className="mx-auto max-w-[1280px]">
        <Link
          href="/explore"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/55 transition-colors hover:border-white/20 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Explore
        </Link>

        <header
          className={`relative mt-5 overflow-hidden rounded-[2rem] border bg-[linear-gradient(128deg,rgba(255,255,255,0.055),rgba(8,8,8,0.98)_56%)] p-6 sm:p-9 lg:p-11 ${tone.border} ${tone.glow}`}
        >
          <div
            className={`pointer-events-none absolute -right-20 -top-24 size-72 rounded-full opacity-20 blur-[100px] ${tone.avatar}`}
          />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div
                className={`flex size-28 shrink-0 items-center justify-center rounded-full border-2 border-black/60 text-3xl font-black tracking-[-0.06em] text-white shadow-2xl sm:size-36 sm:text-4xl ${tone.avatar}`}
              >
                {identity.initials}
              </div>

              <div className="min-w-0">
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
                <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.86] tracking-[-0.065em] text-white sm:text-7xl lg:text-8xl">
                  {identity.displayName}
                </h1>
                <p className="mt-4 text-sm font-semibold text-white/50">
                  {identity.city} · Joined {joinedFormatter.format(new Date(identity.memberSince))}
                </p>
              </div>
            </div>

            <div className="lg:text-right">
              <p className="text-sm leading-7 text-white/55">{identity.bio}</p>
              {identity.instagram && (
                <p className={`mt-4 text-xs font-black ${tone.label}`}>@{identity.instagram}</p>
              )}
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${tone.label}`}>
              Their C1RCLE
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.045em] sm:text-5xl">
              Nights they show up for
            </h2>
            <div className="mt-7 flex flex-wrap gap-2">
              {identity.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/55"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3 rounded-[1.75rem] border border-white/10 bg-black/55 p-4 sm:p-6">
            {[
              { label: 'Upcoming', value: profile.upcomingEvents.length },
              { label: 'Attended', value: profile.attendedEvents.length },
              { label: 'Venues', value: uniqueVenues },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex min-w-0 flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-center sm:p-4"
              >
                <dt className="truncate text-[7px] font-black uppercase tracking-[0.16em] text-white/35 sm:text-[8px]">
                  {stat.label}
                </dt>
                <dd className="mt-2 text-2xl font-black text-white sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="member-events"
          aria-labelledby="member-events-heading"
          className="mt-16 scroll-mt-28"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${tone.label}`}>
                Shared plans
              </p>
              <h2
                id="member-events-heading"
                className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] sm:text-6xl"
              >
                Events
              </h2>
            </div>

            <nav
              aria-label="Public profile event filters"
              className="flex gap-2 rounded-full border border-white/10 p-1.5"
            >
              {(['upcoming', 'attended'] as const).map((filter) => {
                const active = filter === activeFilter;
                return (
                  <Link
                    key={filter}
                    href={`${profileHref}?filter=${filter}#member-events`}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-5 text-[9px] font-black uppercase tracking-[0.2em] transition-colors sm:flex-none ${
                      active
                        ? 'bg-white text-black'
                        : 'text-white/40 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {filter}
                  </Link>
                );
              })}
            </nav>
          </div>

          {events.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <ProfileEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/35">
                No {activeFilter} events shared yet.
              </p>
              <Link
                href="/explore"
                className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-[9px] font-black uppercase tracking-[0.2em] text-black"
              >
                Explore events
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import type { ProfileFixture } from '../types/profile.types';

export function ProfileOverview({ profile }: { profile: ProfileFixture }) {
  const allEvents = [...profile.upcomingEvents, ...profile.attendedEvents];
  const uniqueVenues = new Set(allEvents.map((event) => event.venue)).size;

  const stats = [
    { label: 'Upcoming', value: profile.upcomingEvents.length },
    { label: 'Attended', value: profile.attendedEvents.length },
    { label: 'Venues', value: uniqueVenues },
  ] as const;

  return (
    <section
      aria-labelledby="profile-overview-heading"
      className="grid gap-4 lg:grid-cols-[1fr_0.72fr]"
    >
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
          Member profile
        </p>
        <h2
          id="profile-overview-heading"
          className="mt-4 text-3xl font-black uppercase tracking-[-0.045em] text-white sm:text-5xl"
        >
          Your C1RCLE at a glance
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50">
          Your identity, event history and account controls stay together in one focused space.
        </p>

        <dl className="mt-8 grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-white/35">
                {stat.label}
              </dt>
              <dd className="mt-2 text-2xl font-black text-white sm:text-3xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-black/55 p-6 sm:p-8">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/35">Identity</p>
        <dl className="mt-6 space-y-5">
          <div>
            <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">City</dt>
            <dd className="mt-1 text-sm font-bold text-white">{profile.identity.city}</dd>
          </div>
          <div>
            <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
              Instagram
            </dt>
            <dd className="mt-1 text-sm font-bold text-white">@{profile.identity.instagram}</dd>
          </div>
          <div>
            <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
              Sign-in method
            </dt>
            <dd className="mt-1 text-sm font-bold text-white">{profile.identity.signInMethod}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

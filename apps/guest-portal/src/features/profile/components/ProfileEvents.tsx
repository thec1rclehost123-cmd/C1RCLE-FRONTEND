import Link from 'next/link';

import { ProfileEventCard } from './ProfileEventCard';

import type { ProfileEventFilter, ProfileEventSummary } from '../types/profile.types';

export function ProfileEvents({
  activeFilter,
  events,
}: {
  activeFilter: ProfileEventFilter;
  events: readonly ProfileEventSummary[];
}) {
  return (
    <section aria-labelledby="profile-events-heading">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
            Your nights
          </p>
          <h2
            id="profile-events-heading"
            className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] text-white sm:text-6xl"
          >
            Events
          </h2>
        </div>

        <nav
          aria-label="Profile event filters"
          className="flex gap-2 rounded-full border border-white/10 p-1.5"
        >
          {(['upcoming', 'attended'] as const).map((filter) => {
            const active = filter === activeFilter;
            return (
              <Link
                key={filter}
                href={`/profile?view=events&filter=${filter}`}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-5 text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
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
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <ProfileEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[2rem] border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-white/35">
            {activeFilter === 'upcoming' ? 'No upcoming events yet.' : 'No attended events yet.'}
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
  );
}

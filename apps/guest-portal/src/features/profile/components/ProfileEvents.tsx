import Link from 'next/link';

import { ProfileEventCollection } from './ProfileEventCollection';

import type { ProfileEventFilter, ProfileEventSummary } from '../types/profile.types';

export function ProfileEvents({
  activeFilter,
  events,
  available = true,
}: {
  activeFilter: ProfileEventFilter;
  events: readonly ProfileEventSummary[];
  available?: boolean;
}) {
  const title = activeFilter === 'upcoming' ? 'Upcoming events' : 'Events you’ve attended';

  return (
    <section aria-labelledby="profile-events-heading" className="mx-auto max-w-[1500px]">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="profile-events-heading"
            className="font-heading text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl"
          >
            {title}
          </h2>
        </div>
        <nav
          aria-label="Profile event filters"
          className="flex w-full gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1 sm:w-fit"
        >
          {(['upcoming', 'attended'] as const).map((filter) => {
            const active = filter === activeFilter;
            return (
              <Link
                key={filter}
                href={`/profile?view=events&filter=${filter}`}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-4 text-[10px] font-semibold transition-colors sm:flex-none sm:px-5 ${
                  active
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {filter === 'upcoming' ? 'Upcoming' : 'Attended'}
              </Link>
            );
          })}
        </nav>
      </div>

      {!available ? (
        <div role="alert" className="py-8 text-sm text-white/55">
          {activeFilter === 'attended'
            ? 'Attendance history is temporarily unavailable.'
            : 'Your upcoming events are temporarily unavailable.'}
          <p className="mt-1 text-xs text-white/40">
            Your bookings are still safe. Try again shortly.
          </p>
        </div>
      ) : events.length > 0 ? (
        <ProfileEventCollection events={events} label={title} />
      ) : (
        <div className="flex min-h-36 flex-col items-start justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-6 sm:px-7">
          <p className="text-sm text-white/60">
            {activeFilter === 'upcoming' ? 'No upcoming events yet.' : 'No attended events yet.'}
          </p>
          {activeFilter === 'upcoming' ? (
            <Link
              href="/explore"
              className="mt-3 inline-flex min-h-10 items-center text-xs font-semibold text-white/80 underline decoration-white/25 underline-offset-4 hover:text-white"
            >
              Explore events
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}

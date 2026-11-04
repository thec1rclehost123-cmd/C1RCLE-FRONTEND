import Link from 'next/link';

import { ProfileEventCollection } from './ProfileEventCollection';

import type { ProfileFixture } from '../types/profile.types';

export function ProfileOverview({ profile }: { profile: ProfileFixture }) {
  return (
    <div className="space-y-12 sm:space-y-16">
      <OverviewEventSection
        title="Upcoming events"
        eyebrow="On your calendar"
        view="upcoming"
        events={profile.upcomingEvents}
        available={profile.orderHistoryAvailable ?? true}
        unavailableMessage="Your upcoming events could not be loaded. Try again in a moment."
        emptyMessage="No upcoming events yet."
      />
      <OverviewEventSection
        title="Events you’ve attended"
        eyebrow="Good nights, kept close"
        view="attended"
        events={profile.attendedEvents}
        available={profile.attendanceHistoryAvailable ?? true}
        unavailableMessage="Attendance history could not be loaded. Try again in a moment."
        emptyMessage="Your attended events will show up here after your pass is scanned."
      />
    </div>
  );
}

function OverviewEventSection({
  title,
  eyebrow,
  view,
  events,
  available,
  unavailableMessage,
  emptyMessage,
}: {
  title: string;
  eyebrow: string;
  view: 'upcoming' | 'attended';
  events: ProfileFixture['upcomingEvents'];
  available: boolean;
  unavailableMessage: string;
  emptyMessage: string;
}) {
  return (
    <section aria-labelledby={`profile-${view}-heading`}>
      <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#FF6842]">
            {eyebrow}
          </p>
          <h2
            id={`profile-${view}-heading`}
            className="mt-2 font-heading text-xl font-semibold tracking-[-0.035em] text-white sm:text-2xl"
          >
            {title}
          </h2>
        </div>
        {available && events.length > 0 ? (
          <Link
            href={`/profile?view=events&filter=${view}`}
            className="inline-flex min-h-10 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-3"
          >
            View all{' '}
            <span aria-hidden="true" className="ml-1">
              →
            </span>
          </Link>
        ) : null}
      </div>

      {!available ? (
        <div role="status" className="py-8 text-sm text-white/55">
          {unavailableMessage}
        </div>
      ) : events.length > 0 ? (
        <ProfileEventCollection events={events} label={title} />
      ) : (
        <div className="flex min-h-28 flex-col items-start justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-5 sm:px-6">
          <p className="text-sm text-white/60">{emptyMessage}</p>
          {view === 'upcoming' ? (
            <Link
              href="/explore"
              className="mt-3 inline-flex min-h-10 items-center text-xs font-semibold text-white/80 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white"
            >
              Find your next event
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}

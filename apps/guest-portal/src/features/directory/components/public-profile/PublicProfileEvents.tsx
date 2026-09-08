import Link from 'next/link';

import { DirectoryEventCard } from '../DirectoryEventCard';

import { PublicProfileSectionHeading } from './PublicProfileSectionHeading';

import type { DirectoryEventSummary } from '../../types/directory.types';

export function PublicProfileEvents({
  events,
  eyebrow = 'On the calendar',
  title = 'Upcoming events',
}: {
  events: readonly DirectoryEventSummary[];
  eyebrow?: string;
  title?: string;
}) {
  return (
    <section
      id="events"
      aria-labelledby="profile-events-heading"
      className="scroll-mt-28 py-20 sm:py-28"
    >
      <PublicProfileSectionHeading eyebrow={eyebrow} title={title} id="profile-events-heading" />

      {events.length > 0 ? (
        <div
          data-profile-reveal
          className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {events.map((event) => (
            <DirectoryEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div
          data-profile-reveal
          className="mt-9 rounded-[2rem] border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center"
        >
          <p className="text-sm font-black uppercase tracking-[0.2em] text-white/35">
            No announced events yet.
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

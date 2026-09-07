import Image from 'next/image';
import Link from 'next/link';

import type { ProfileEventSummary } from '../types/profile.types';

const eventDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});

export function ProfileEventCard({ event }: { event: ProfileEventSummary }) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0B0B0B] transition-colors hover:border-white/20">
      <Link href={`/event/${event.slug}`} aria-label={`View ${event.title}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
          <Image
            src={event.image}
            alt={`${event.title} event poster`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white">
            {event.participationLabel}
          </span>
        </div>
        <div className="p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#FF6B4A]">
            {eventDateFormatter.format(new Date(event.startsAt))}
          </p>
          <h3 className="mt-3 text-2xl font-black uppercase leading-none tracking-[-0.045em] text-white">
            {event.title}
          </h3>
          <p className="mt-3 text-xs font-semibold text-white/45">
            {event.venue}, {event.city}
          </p>
        </div>
      </Link>
    </article>
  );
}

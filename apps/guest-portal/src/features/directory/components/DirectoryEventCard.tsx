import Image from 'next/image';
import Link from 'next/link';

import type { DirectoryEventSummary } from '../types/directory.types';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});

export function DirectoryEventCard({ event }: { event: DirectoryEventSummary }) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0A0A0A] transition-colors hover:border-white/20">
      <Link href={`/event/${event.slug}`} aria-label={`View ${event.title}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
          <Image
            src={event.image}
            alt={`${event.title} event poster`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white">
            {event.category}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#FF6B4A]">
          {dateFormatter.format(new Date(event.startsAt))}
        </p>
        <Link href={`/event/${event.slug}`}>
          <h3 className="mt-3 text-2xl font-black uppercase leading-none tracking-[-0.045em] text-white transition-colors group-hover:text-[#FF7654]">
            {event.title}
          </h3>
        </Link>
        <Link
          href={`/venue/${event.venueId}`}
          className="mt-3 inline-flex text-xs font-semibold text-white/45 transition-colors hover:text-white"
        >
          {event.venue}, {event.city}
        </Link>
      </div>
    </article>
  );
}

import Image from 'next/image';

import { getEventAccentClasses } from '../eventDetailPalette';

import type { EventDetailFixture } from '../types/event-detail.types';

const posterDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  timeZone: 'Asia/Kolkata',
});

export function EventPosterPanel({ event }: { event: EventDetailFixture }) {
  const accent = getEventAccentClasses(event.accentTone);

  return (
    <section
      aria-label="Event poster"
      className={`rounded-[1.75rem] border bg-black/65 p-3 backdrop-blur-xl ${accent.borderStrong} ${accent.posterShadow}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.35rem] border border-white/10 bg-black">
        <Image
          src={event.image}
          alt={`${event.title} event poster`}
          fill
          preload
          sizes="(max-width: 1024px) 100vw, 420px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
            {event.category}
          </span>
          <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
            {posterDateFormatter.format(new Date(event.startsAt))}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-4" aria-hidden="true">
        <span className={`h-1.5 w-8 rounded-full ${accent.solid}`} />
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
      </div>
    </section>
  );
}

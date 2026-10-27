import Image from 'next/image';

import { EventArtworkFallback } from '@/features/explore/components/EventArtworkFallback';

import type { EventDetailFixture } from '../types/event-detail.types';

const posterDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  timeZone: 'Asia/Kolkata',
});

export function EventPosterPanel({ event }: { event: EventDetailFixture }) {
  return (
    <section
      aria-label="Event poster"
      className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#111] shadow-[0_24px_70px_rgba(0,0,0,0.45)] lg:max-w-none"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black">
        {event.image === '/c1rcle-logo.webp' ? (
          <EventArtworkFallback startsAt={event.startsAt} category={event.category} />
        ) : (
          <Image
            src={event.image}
            alt={`${event.title} event poster`}
            fill
            unoptimized
            preload
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover brightness-[1.08] contrast-[1.03] saturate-[1.1]"
          />
        )}
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
    </section>
  );
}

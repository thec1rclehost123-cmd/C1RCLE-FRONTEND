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
      className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl bg-transparent shadow-[0_18px_52px_rgba(0,0,0,0.42)] md:max-w-[320px] lg:max-w-[340px]"
    >
      <div className="relative aspect-[4/5] max-h-[62svh] overflow-hidden bg-black/30 sm:max-h-[72vh]">
        {event.image === '/c1rcle-logo.webp' ? (
          <EventArtworkFallback startsAt={event.startsAt} category={event.category} hero />
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
          <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
            {event.category}
          </span>
          <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
            {posterDateFormatter.format(new Date(event.startsAt))}
          </span>
        </div>
      </div>
    </section>
  );
}

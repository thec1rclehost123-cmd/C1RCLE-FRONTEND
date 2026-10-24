import Image from 'next/image';
import Link from 'next/link';

import { EventArtworkFallback } from './EventArtworkFallback';

import type { ExploreEvent } from '../types/explore.types';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});
const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function ExploreEventCard({
  event,
  landscape = false,
}: {
  event: ExploreEvent;
  landscape?: boolean;
}) {
  const priceLabel = event.price
    ? `From ${moneyFormatter.format(event.price.amountPaise / 100)}`
    : event.isFree
      ? 'Free'
      : 'Price unavailable';
  const eventDate = new Date(event.startsAt);
  const eventDateLabel = dateFormatter.format(eventDate);
  const eventTimeLabel = timeFormatter.format(eventDate);
  const locationLabel = [event.venue, event.city]
    .map((location) => location.trim())
    .filter(Boolean)
    .join(', ');

  return (
    <article className="h-full">
      <Link
        href={`/event/${event.slug}`}
        aria-label={`View ${event.title}. ${eventDateLabel} at ${eventTimeLabel}. ${locationLabel}. ${priceLabel}.`}
        className={`group relative block overflow-hidden rounded-[1.15rem] border border-white/10 bg-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-[transform,box-shadow] duration-300 hover:scale-[1.025] hover:shadow-[0_20px_42px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none ${landscape ? 'aspect-[16/9]' : 'aspect-[4/5]'} sm:rounded-[1.25rem]`}
      >
        {event.image === '/c1rcle-logo.webp' ? (
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transition-none">
            <EventArtworkFallback startsAt={event.startsAt} category={event.category} />
          </div>
        ) : (
          <Image
            src={event.image}
            alt={`${event.title} event poster`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transition-none"
          />
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        />

        <div className="event-card-top-pills pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2.5 transition-opacity duration-200 sm:p-3 motion-reduce:transition-none">
          <span className="rounded-full border border-white/20 bg-black/65 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-white shadow-md backdrop-blur-md sm:px-3 sm:text-[9px]">
            {eventDateLabel}
          </span>
          <span className="rounded-full border border-white/20 bg-black/65 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-white shadow-md backdrop-blur-md sm:px-3 sm:text-[9px]">
            {priceLabel}
          </span>
        </div>

        <div className="event-card-details pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black via-black/90 to-transparent p-3 pt-14 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none sm:p-4 sm:pt-16">
          <h3
            className={`line-clamp-3 font-bold uppercase leading-tight tracking-[-0.025em] text-white ${landscape ? 'text-sm sm:text-base' : 'text-sm sm:text-base lg:text-lg'}`}
          >
            {event.title}
          </h3>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.08em] text-white/80 sm:text-[11px] sm:font-black sm:tracking-[0.14em]">
            {eventDateLabel} · {eventTimeLabel}
          </p>
          <p className="mt-1 text-xs font-medium text-white/70">{locationLabel}</p>
        </div>
      </Link>
    </article>
  );
}

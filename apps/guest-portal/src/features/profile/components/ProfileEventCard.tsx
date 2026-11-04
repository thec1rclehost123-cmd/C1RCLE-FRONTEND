import Image from 'next/image';
import Link from 'next/link';

import type { ProfileEventSummary } from '../types/profile.types';

const eventDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});

const eventDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  hour12: true,
  minute: '2-digit',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function ProfileEventCard({
  event,
  posterOnly = false,
}: {
  event: ProfileEventSummary;
  posterOnly?: boolean;
}) {
  if (posterOnly) {
    return (
      <article className="group relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-[0_14px_38px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:scale-[1.025] hover:shadow-[0_22px_48px_rgba(0,0,0,0.4)] focus-within:scale-[1.025] motion-reduce:transition-none">
        <Link
          href={event.detailHref ?? `/event/${event.slug}`}
          aria-label={`View ${event.title}`}
          className="block focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"
        >
          <div className="relative aspect-[2/3] overflow-hidden">
            <Image
              src={event.image}
              alt={`${event.title} event poster`}
              fill
              unoptimized
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 18vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transition-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5" />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15 motion-reduce:transition-none" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <time
                dateTime={event.startsAt}
                className="mb-3 inline-flex max-w-full rounded-lg border border-white/25 bg-black/45 px-2.5 py-2 text-[9px] font-bold uppercase leading-tight tracking-wide text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:mb-4 sm:px-3 sm:text-[10px]"
              >
                {eventDateTimeFormatter
                  .format(new Date(event.startsAt))
                  .replace(',', ' ·')
                  .replace(' at ', ' · ')
                  .toUpperCase()}
              </time>
              <h3 className="line-clamp-3 text-[clamp(0.9rem,1.45vw,1.5rem)] font-bold uppercase leading-[1.08] tracking-[-0.035em] text-white">
                {event.title}
              </h3>
              {[event.venue, event.city].filter(Boolean).join(', ') ? (
                <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-white/80 sm:text-sm">
                  {[event.venue, event.city].filter(Boolean).join(', ')}
                </p>
              ) : null}
            </div>
          </div>
        </Link>
      </article>
    );
  }
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0B0B0B] transition-colors hover:border-white/20">
      <Link href={event.detailHref ?? `/event/${event.slug}`} aria-label={`View ${event.title}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
          <Image
            src={event.image}
            alt={`${event.title} event poster`}
            fill
            unoptimized
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
          {event.bookingReference && event.amountPaise !== undefined ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              <span>{event.bookingReference}</span>
              <span>{moneyFormatter.format(event.amountPaise / 100)}</span>
            </div>
          ) : null}
        </div>
      </Link>
      {event.bookingHref ? (
        <Link
          href={event.bookingHref}
          className="mx-5 mb-5 inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-white"
        >
          Booking details
        </Link>
      ) : null}
    </article>
  );
}

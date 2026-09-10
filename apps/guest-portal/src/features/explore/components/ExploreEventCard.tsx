import Image from 'next/image';
import Link from 'next/link';

import type { ExploreEvent } from '../types/explore.types';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function ExploreEventCard({ event }: { event: ExploreEvent }) {
  const priceLabel = event.price
    ? `From ${moneyFormatter.format(event.price.amountPaise / 100)}`
    : 'Free';

  return (
    <article className="group h-full">
      <Link
        href={`/event/${event.slug}`}
        className="relative block aspect-[4/5] min-h-[24rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 shadow-lg transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:min-h-[26rem] sm:rounded-[1.75rem]"
      >
        <Image
          src={event.image}
          alt={`${event.title} event poster`}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[58%] translate-y-[72%] bg-gradient-to-t from-black via-black/95 to-transparent transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0 motion-reduce:transition-none"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
          <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md">
            {event.category}
          </span>
          {event.badge && (
            <span className="rounded-full bg-[#FF6B4A] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-black">
              {event.badge}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FF6B4A]">
            {dateFormatter.format(new Date(event.startsAt))} · {priceLabel}
          </p>
          <h3 className="mt-2 text-[1.75rem] font-black uppercase leading-none tracking-[-0.04em] text-white sm:text-3xl">
            {event.title}
          </h3>
          <p className="mt-2 text-sm font-medium text-white/65">
            {event.venue}, {event.city}
          </p>
          <span className="mt-4 inline-flex min-h-10 items-center rounded-full bg-white px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-black sm:mt-5 sm:min-h-11 sm:py-3 sm:text-[10px]">
            Book tickets
          </span>
        </div>
      </Link>
    </article>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { ExploreEvent } from '../types/explore.types';

const heroDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});

const heroTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const interestedAvatars = [
  { initials: 'RI', colorClass: 'bg-[#FFD400]' },
  { initials: 'IS', colorClass: 'bg-[#FF315D]' },
  { initials: 'AJ', colorClass: 'bg-[#9B43F5]' },
  { initials: 'MK', colorClass: 'bg-[#55D6A7]' },
  { initials: 'DV', colorClass: 'bg-[#FFB86B]' },
] as const;

const heroPosterPosition: Record<string, string> = {
  'neon-nights': 'object-[center_28%]',
  'rooftop-jazz': 'object-[center_38%]',
  'techno-bunker': 'object-[center_34%]',
};

export function ExploreHeroCarouselClient({ events }: { events: readonly ExploreEvent[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (events.length < 2 || reducedMotion) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % events.length);
    }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, events.length]);

  const event = events[activeIndex];
  if (!event) return null;
  const posterPosition = heroPosterPosition[event.id] ?? 'object-center';

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + events.length) % events.length);
  };
  const showNext = () => {
    setActiveIndex((current) => (current + 1) % events.length);
  };

  return (
    <div
      role="region"
      aria-label="Featured event carousel"
      aria-roledescription="carousel"
      className="relative mx-auto min-h-[36rem] max-w-[1680px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909] shadow-2xl sm:min-h-[40rem] sm:rounded-[3rem] lg:min-h-[44rem]"
    >
      <Image
        key={event.image}
        src={event.image}
        alt={`${event.title} event poster`}
        fill
        preload
        sizes="(max-width: 1024px) 100vw, 1680px"
        className={`object-cover brightness-110 saturate-110 transition-opacity duration-500 motion-reduce:transition-none ${posterPosition}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/5 lg:bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.58)_42%,rgba(0,0,0,0.12)_78%,rgba(0,0,0,0.04)_100%)]" />

      <div className="relative flex min-h-[36rem] flex-col justify-end px-6 pb-24 pt-20 sm:min-h-[40rem] sm:px-10 lg:min-h-[44rem] lg:max-w-[58%] lg:px-16 lg:pb-28">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
          Featured experience
        </p>
        <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-white sm:text-7xl lg:text-7xl 2xl:text-8xl">
          {event.title}
        </h1>
        <p className="mt-6 max-w-xl text-sm font-semibold text-white/75 sm:text-base">
          {heroDateFormatter.format(new Date(event.startsAt))} ·{' '}
          {heroTimeFormatter.format(new Date(event.startsAt))} · {event.venue}, {event.city}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link
            href={`/event/${event.slug}`}
            className="inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
          >
            Get tickets
          </Link>
          <div className="flex items-center gap-3" aria-label="184 people interested">
            <div className="flex -space-x-2.5" aria-hidden="true">
              {interestedAvatars.map(({ initials, colorClass }) => (
                <span
                  key={initials}
                  className={`flex size-9 items-center justify-center rounded-full border-2 border-black text-[9px] font-black text-black shadow-lg sm:size-10 ${colorClass}`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
              184 interested
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 sm:bottom-8 sm:left-10 sm:right-10 lg:left-16">
        <div className="flex gap-2" aria-label="Choose featured event">
          {events.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show ${slide.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => {
                setActiveIndex(index);
              }}
              className={`h-2 rounded-full transition-[width,background-color] motion-reduce:transition-none ${
                index === activeIndex ? 'w-10 bg-[#FF4400]' : 'w-2 bg-white/35 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous featured event"
            onClick={showPrevious}
            className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-xl text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            aria-label="Next featured event"
            onClick={showNext}
            className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-xl text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

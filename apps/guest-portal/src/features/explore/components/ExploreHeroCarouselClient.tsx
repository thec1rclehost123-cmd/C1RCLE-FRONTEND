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
      className="relative mx-auto min-h-[36rem] max-w-[1540px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909] shadow-2xl sm:min-h-[40rem] sm:rounded-[3rem] lg:min-h-[44rem]"
    >
      <div key={`${event.id}-background`} className="explore-hero-background-reveal absolute inset-0">
        <Image
          src={event.image}
          alt=""
          fill
          preload={activeIndex === 0}
          sizes="(max-width: 1024px) 100vw, 1540px"
          className="object-cover object-top brightness-110 saturate-110 md:scale-[1.04] md:object-center md:opacity-75 md:blur-[3px] md:brightness-105 md:saturate-125"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent md:bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.55)_46%,rgba(0,0,0,0.18)_100%)]" />

      {/* Ambient Orange Glow Behind Expanded Poster */}
      <div className="pointer-events-none absolute right-[4%] top-1/2 z-0 hidden h-[82%] w-[35%] -translate-y-1/2 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(255,68,0,0.6)_0%,rgba(255,68,0,0.25)_45%,transparent_75%)] blur-3xl md:block" />

      {/* Expanded Poster Container */}
      <div className="absolute right-[6%] top-1/2 z-10 hidden h-[72%] w-[31%] -translate-y-1/2 overflow-hidden rounded-[1.5rem] border border-[#FF4400]/40 bg-black/80 p-2 shadow-[0_0_50px_rgba(255,68,0,0.35),0_30px_90px_rgba(0,0,0,0.8)] transition-all duration-500 hover:border-[#FF4400]/70 hover:shadow-[0_0_70px_rgba(255,68,0,0.5),0_30px_90px_rgba(0,0,0,0.9)] md:block lg:right-[8%] lg:h-[76%] lg:w-[29%] lg:rounded-[2rem] lg:p-3">
        <div
          key={`${event.id}-poster`}
          className="explore-hero-poster-reveal relative h-full w-full overflow-hidden rounded-[1rem] lg:rounded-[1.35rem]"
        >
          <Image
            src={event.image}
            alt={`${event.title} featured poster`}
            fill
            sizes="(max-width: 1024px) 31vw, 29vw"
            className="object-contain object-center brightness-105 saturate-110"
          />
        </div>
      </div>

      <div
        key={`${event.id}-copy`}
        className="relative z-20 flex min-h-[36rem] flex-col justify-center px-6 pb-24 pt-10 sm:min-h-[40rem] sm:px-10 md:max-w-[58%] lg:min-h-[44rem] lg:max-w-[56%] lg:px-16"
      >
        <p className="explore-hero-copy-reveal explore-hero-delay-1 text-xs font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
          Featured experience
        </p>
        <h1 className="explore-hero-copy-reveal explore-hero-delay-2 mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">
          {event.title}
        </h1>
        <p className="explore-hero-copy-reveal explore-hero-delay-3 mt-6 max-w-xl text-sm font-semibold text-white/75 sm:text-base">
          {heroDateFormatter.format(new Date(event.startsAt))} ·{' '}
          {heroTimeFormatter.format(new Date(event.startsAt))} · {event.venue}, {event.city}
        </p>
        <div className="explore-hero-copy-reveal explore-hero-delay-4 mt-8 flex flex-wrap items-center gap-5">
          <Link
            href={`/event/${event.slug}`}
            className="inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
          >
            Get tickets
          </Link>
          <div className="flex items-center gap-4" aria-label="184 people interested">
            <div className="flex -space-x-3.5" aria-hidden="true">
              {interestedAvatars.map(({ initials, colorClass }) => (
                <span
                  key={initials}
                  className={`flex size-12 items-center justify-center rounded-full border-2 border-black text-xs font-black text-black shadow-xl sm:size-14 sm:text-sm ${colorClass}`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-white/80">
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

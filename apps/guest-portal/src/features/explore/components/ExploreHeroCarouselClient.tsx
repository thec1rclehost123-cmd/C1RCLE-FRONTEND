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

export function ExploreHeroCarouselClient({ events }: { events: readonly ExploreEvent[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (paused || events.length < 2 || reducedMotion) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % events.length);
    }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, events.length, paused]);

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
      className="relative mx-auto min-h-[34rem] max-w-[1500px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909] shadow-2xl sm:min-h-[38rem] sm:rounded-[3rem] lg:min-h-[42rem]"
    >
      <Image
        key={event.image}
        src={event.image}
        alt=""
        fill
        preload={activeIndex === 0}
        sizes="(max-width: 1024px) 100vw, 1500px"
        className="object-cover opacity-55 transition-opacity duration-500 motion-reduce:transition-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/15 lg:bg-gradient-to-r lg:from-black lg:via-black/55 lg:to-black/10" />

      <div className="relative flex min-h-[34rem] flex-col justify-end px-6 pb-24 pt-20 sm:min-h-[38rem] sm:px-10 lg:min-h-[42rem] lg:max-w-[62%] lg:px-16 lg:pb-28">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
          Featured experience
        </p>
        <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">
          {event.title}
        </h1>
        <p className="mt-6 max-w-xl text-sm font-semibold text-white/75 sm:text-base">
          {heroDateFormatter.format(new Date(event.startsAt))} ·{' '}
          {heroTimeFormatter.format(new Date(event.startsAt))} · {event.venue}, {event.city}
        </p>
        <div className="mt-8">
          <Link
            href={`/event/${event.slug}`}
            className="inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
          >
            Get tickets
          </Link>
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
            aria-label={paused ? 'Play featured events' : 'Pause featured events'}
            aria-pressed={paused}
            onClick={() => {
              setPaused((current) => !current);
            }}
            className="flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-black/35 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {paused ? 'Play' : 'Pause'}
          </button>
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

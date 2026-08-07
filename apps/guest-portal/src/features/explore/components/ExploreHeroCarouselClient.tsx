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
  'from-[#ff754d] to-[#ff3d1f]',
  'from-[#ff8a60] to-[#ff4b2b]',
  'from-[#ff9d73] to-[#ff5d35]',
  'from-[#ffb08a] to-[#ff714b]',
  'from-[#ffc0a3] to-[#ff845d]',
] as const;

export function ExploreHeroCarouselClient({ events }: { events: readonly ExploreEvent[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (events.length < 2 || reducedMotion) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % events.length);
    }, 7200);

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
      className="relative min-h-[760px] w-full overflow-hidden bg-black lg:min-h-[min(940px,100svh)]"
    >
      <div
        key={`${event.id}-background`}
        className="explore-hero-background-reveal absolute inset-0"
      >
        <Image
          src={event.image}
          alt=""
          fill
          preload={activeIndex === 0}
          sizes="100vw"
          className="scale-[1.06] object-cover object-center brightness-[0.8] saturate-[1.18] blur-[1.5px]"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_73%_42%,transparent_0%,rgba(0,0,0,0.12)_25%,rgba(0,0,0,0.72)_78%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.57)_48%,rgba(0,0,0,0.18)_78%,rgba(0,0,0,0.5)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black via-black/72 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 to-transparent" />

      <div
        key={`${event.id}-poster`}
        className="explore-hero-poster-reveal absolute right-4 top-[17%] z-10 w-[57%] max-w-[265px] overflow-hidden rounded-[1.55rem] border border-white/24 bg-black/40 p-1.5 shadow-[0_34px_110px_rgba(0,0,0,0.58),0_0_55px_rgba(255,68,0,0.12)] sm:right-[7%] sm:top-[18%] sm:max-w-[340px] lg:right-[7%] lg:top-[18%] lg:w-[34%] lg:max-w-[540px] lg:rounded-[2rem] lg:p-2"
      >
        <div className="relative aspect-[0.78] overflow-hidden rounded-[1.2rem] lg:rounded-[1.8rem]">
          <Image
            src={event.image}
            alt={`${event.title} featured poster`}
            fill
            sizes="(max-width: 640px) 55vw, (max-width: 1024px) 330px, 31vw"
            className="object-cover object-center brightness-[1.18] contrast-[1.05] saturate-[1.24]"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
        </div>
      </div>

      <div
        key={`${event.id}-copy`}
        className="relative z-20 mx-auto flex min-h-[760px] w-full max-w-[1720px] flex-col justify-end px-5 pb-28 pt-32 sm:px-10 sm:pb-32 lg:min-h-[min(940px,100svh)] lg:justify-center lg:px-[6%] lg:pb-16 lg:pt-36"
      >
        <div className="max-w-[34rem] lg:max-w-[56%] lg:translate-x-[3vw]">
          <p className="explore-hero-copy-reveal explore-hero-delay-1 inline-flex rounded-full border border-[#ff5a2b]/50 bg-[#ff4400]/15 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] text-[#ff7857] backdrop-blur-xl sm:text-[10px]">
            {event.badge ?? event.category}
          </p>

          <h1 className="explore-hero-copy-reveal explore-hero-delay-2 mt-5 text-[clamp(2.6rem,4.25vw,4.8rem)] font-black uppercase leading-[0.9] tracking-[-0.055em] text-white drop-shadow-[0_16px_45px_rgba(0,0,0,0.55)]">
            {event.title}
          </h1>

          <div className="explore-hero-copy-reveal explore-hero-delay-3 mt-7 flex flex-col gap-3 text-base font-bold text-white/82 sm:text-lg lg:text-xl">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="inline-flex items-center gap-2.5">
                <CalendarIcon />
                {heroDateFormatter.format(new Date(event.startsAt))}
              </span>
              <span aria-hidden="true" className="hidden text-white/35 sm:inline">
                •
              </span>
              <span className="inline-flex items-center gap-2.5">
                <ClockIcon />
                {heroTimeFormatter.format(new Date(event.startsAt))}
              </span>
            </div>
            <span className="inline-flex items-center gap-3 text-white/68">
              <LocationIcon />
              {event.venue}, {event.city}
            </span>
          </div>

          <div className="explore-hero-copy-reveal explore-hero-delay-4 mt-9 flex flex-wrap items-center gap-4">
            <Link
              href={`/event/${event.slug}`}
              className="inline-flex min-h-[4.25rem] items-center justify-center rounded-full bg-white px-10 py-4 text-[13px] font-black uppercase tracking-[0.2em] text-black shadow-[0_12px_35px_rgba(255,255,255,0.14)] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:min-h-[4.5rem] sm:px-12 sm:text-sm"
            >
              Get tickets
            </Link>
            <div
              className="flex min-h-[4.25rem] items-center gap-4 rounded-full border border-white/20 bg-white/[0.1] px-5 py-2.5 backdrop-blur-2xl sm:min-h-[4.5rem] sm:px-6"
              aria-label="184 people interested"
            >
              <span className="flex -space-x-3" aria-hidden="true">
                {interestedAvatars.map((gradient) => (
                  <span
                    key={gradient}
                    className={`size-10 rounded-full border-2 border-[#37221e] bg-gradient-to-br sm:size-11 ${gradient}`}
                  />
                ))}
              </span>
              <span className="whitespace-nowrap text-xs font-black uppercase tracking-[0.12em] text-white/88 sm:text-[13px]">
                +184 Interested
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-7 z-30 flex items-center justify-center gap-3 sm:bottom-9">
        <button
          type="button"
          aria-label="Previous featured event"
          onClick={showPrevious}
          className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xl text-white backdrop-blur-xl transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">←</span>
        </button>

        <div
          className="flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-5 backdrop-blur-xl"
          aria-label="Choose featured event"
        >
          {events.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show ${slide.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => {
                setActiveIndex(index);
              }}
              className={`h-1.5 rounded-full transition-[width,background-color] motion-reduce:transition-none ${
                index === activeIndex ? 'w-9 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next featured event"
          onClick={showNext}
          className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xl text-white backdrop-blur-xl transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6 shrink-0 fill-none stroke-[#ff5a2b] stroke-2 sm:size-7"
    >
      <path d="M5 4v3M19 4v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13H4V7a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6 shrink-0 fill-none stroke-[#ff5a2b] stroke-2 sm:size-7"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6 shrink-0 fill-none stroke-[#ff5a2b] stroke-2 sm:size-7"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

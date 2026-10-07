'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

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
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayAllowed, setAutoplayAllowed] = useState(true);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let visible = true;

    const updateAutoplay = () => {
      setAutoplayAllowed(visible && !document.hidden && !(motionQuery?.matches ?? false));
    };

    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry?.isIntersecting ?? false;
              updateAutoplay();
            },
            { rootMargin: '120px 0px' },
          )
        : null;

    observer?.observe(carousel);
    document.addEventListener('visibilitychange', updateAutoplay);
    motionQuery?.addEventListener('change', updateAutoplay);
    updateAutoplay();

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', updateAutoplay);
      motionQuery?.removeEventListener('change', updateAutoplay);
    };
  }, []);

  useEffect(() => {
    if (events.length < 2 || !autoplayAllowed) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % events.length);
    }, 7200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, autoplayAllowed, events.length]);

  const event = events[activeIndex];
  if (!event) return null;

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + events.length) % events.length);
  };
  const showNext = () => {
    setActiveIndex((current) => (current + 1) % events.length);
  };

  return (
    <div className="relative z-10 px-3 pb-5 pt-20 sm:px-6 sm:pb-6 sm:pt-24 lg:px-8">
      {/* Ambient Gradient Glow Behind Curved Hero Card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[52%] z-0 h-[92%] w-[96%] max-w-[1620px] -translate-x-1/2 -translate-y-1/2 rounded-[3.5rem] bg-[radial-gradient(ellipse_at_72%_48%,rgba(255,90,43,0.38)_0%,rgba(255,68,0,0.2)_36%,transparent_72%)] blur-[58px]"
      />

      {/* Curved Edge Rectangle Hero Container */}
      <div
        ref={carouselRef}
        role="region"
        aria-label="Featured event carousel"
        aria-roledescription="carousel"
        className="relative mx-auto min-h-[850px] max-w-[1540px] overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#080808] shadow-[0_28px_90px_rgba(0,0,0,0.9),0_0_100px_rgba(255,68,0,0.16)] sm:min-h-[700px] sm:rounded-[2.5rem] lg:h-[calc(100svh-11rem)] lg:min-h-[540px] lg:max-h-[790px] lg:rounded-[3rem]"
      >
        {/* Background Image & Cinematic Gradient */}
        <div
          key={`${event.id}-background`}
          className="explore-hero-background-reveal absolute inset-0"
        >
          <Image
            src={event.image}
            alt=""
            fill
            unoptimized
            preload={activeIndex === 0}
            sizes="(max-width: 1024px) 100vw, 1540px"
            className="scale-[1.025] object-cover object-center brightness-[0.88] saturate-[1.12]"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,transparent_0%,rgba(0,0,0,0.06)_26%,rgba(0,0,0,0.72)_82%)] sm:bg-[radial-gradient(circle_at_74%_40%,transparent_0%,rgba(0,0,0,0.08)_27%,rgba(0,0,0,0.74)_82%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.44)_0%,rgba(0,0,0,0.08)_28%,rgba(0,0,0,0.46)_50%,rgba(0,0,0,0.92)_72%,#000_100%)] sm:bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.82)_27%,rgba(0,0,0,0.48)_50%,rgba(0,0,0,0.12)_76%,rgba(0,0,0,0.32)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[56%] bg-gradient-to-t from-black via-black/70 to-transparent sm:h-[46%] sm:via-black/46" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/52 to-transparent" />

        {/* Right Side Expanded Event Poster Card */}
        <div
          key={`${event.id}-poster`}
          className="explore-hero-poster-reveal absolute left-1/2 top-[5.25rem] z-10 h-[14.75rem] w-[11.5rem] -translate-x-1/2 overflow-hidden rounded-[1.25rem] border border-white/22 bg-black/60 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.82),0_0_38px_rgba(255,68,0,0.2)] sm:left-auto sm:right-[7%] sm:top-1/2 sm:h-[66%] sm:w-[29%] sm:max-w-[390px] sm:translate-x-0 sm:-translate-y-1/2 sm:rounded-[1.5rem] sm:p-2 md:right-[8%] lg:right-[10%] lg:h-[68%] lg:w-[27%] lg:rounded-[1.8rem] lg:p-2.5"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[0.95rem] sm:rounded-[1.1rem] lg:rounded-[1.35rem]">
            <Image
              src={event.image}
              alt={`${event.title} featured poster`}
              fill
              unoptimized
              loading={activeIndex === 0 ? 'eager' : 'lazy'}
              sizes="(max-width: 640px) 184px, (max-width: 1024px) 29vw, 27vw"
              className="object-cover object-center brightness-[1.08] contrast-[1.04] saturate-[1.15]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
          </div>
        </div>

        {/* Left Side Content Info */}
        <div
          key={`${event.id}-copy`}
          className="relative z-20 flex min-h-[850px] w-full flex-col justify-start px-5 pb-24 pt-[21.25rem] sm:min-h-[700px] sm:justify-center sm:px-9 sm:pb-20 sm:pt-20 lg:h-full lg:min-h-0 lg:px-12 lg:pb-20 lg:pl-[7.5%] xl:pl-[9%]"
        >
          <div className="w-full sm:max-w-[58%] md:max-w-[56%] lg:max-w-[54%] xl:max-w-[55rem]">
            <p className="explore-hero-copy-reveal explore-hero-delay-1 inline-flex items-center gap-2 rounded-full border border-[#ff5a2b]/45 bg-black/36 px-4 py-2 text-[8px] font-black uppercase tracking-[0.28em] text-[#ff7857] backdrop-blur-xl sm:px-5 sm:py-2.5 sm:text-[9px]">
              <span className="size-1.5 rounded-full bg-[#ff5a2b] shadow-[0_0_12px_rgba(255,90,43,0.9)]" />
              {event.badge ?? 'Featured experience'}
            </p>

            <h2 className="explore-hero-copy-reveal explore-hero-delay-2 mt-4 max-w-[12ch] text-[clamp(2.35rem,11vw,3.25rem)] font-black uppercase leading-[0.88] tracking-[-0.058em] text-white drop-shadow-[0_14px_42px_rgba(0,0,0,0.7)] sm:mt-5 sm:text-[clamp(3rem,5.2vw,5rem)]">
              {event.title}
            </h2>

            <div className="explore-hero-copy-reveal explore-hero-delay-3 mt-5 flex flex-col gap-2.5 text-[13px] font-bold text-white/82 sm:mt-6 sm:gap-3 sm:text-sm lg:text-base">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 sm:gap-x-4">
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

            <div className="explore-hero-copy-reveal explore-hero-delay-4 mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
              <Link
                href={`/event/${event.slug}`}
                className="inline-flex min-h-13 items-center justify-center rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[0_12px_35px_rgba(255,255,255,0.14)] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:min-h-14 sm:px-8 sm:text-xs"
              >
                Get tickets
              </Link>
              <div
                className="flex min-h-13 min-w-0 items-center justify-center gap-2 rounded-full border border-white/16 bg-black/38 px-3 py-2 backdrop-blur-xl sm:min-h-14 sm:justify-start sm:gap-3 sm:px-4"
                aria-label="184 people interested"
              >
                <span className="flex -space-x-3" aria-hidden="true">
                  {interestedAvatars.map((gradient) => (
                    <span
                      key={gradient}
                      className={`size-7 rounded-full border-2 border-[#241815] bg-gradient-to-br last:hidden sm:size-8 sm:last:flex ${gradient}`}
                    />
                  ))}
                </span>
                <span className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.1em] text-white/88 sm:text-[10px] sm:tracking-[0.12em]">
                  +184 <span className="hidden sm:inline">Interested</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrow & Dots Controls */}
        <div className="absolute inset-x-0 bottom-8 z-30 flex items-center justify-center gap-2 sm:bottom-9 sm:gap-3">
          <button
            type="button"
            aria-label="Previous featured event"
            onClick={showPrevious}
            className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-lg text-white backdrop-blur-xl transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-11 sm:text-xl"
          >
            <span aria-hidden="true">←</span>
          </button>

          <div
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-4 backdrop-blur-xl sm:min-h-11 sm:gap-2 sm:px-5"
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
                  index === activeIndex
                    ? 'w-7 bg-white sm:w-9'
                    : 'w-1.5 bg-white/35 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next featured event"
            onClick={showNext}
            className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-lg text-white backdrop-blur-xl transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-11 sm:text-xl"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0 fill-none stroke-[#ff5a2b] stroke-2 sm:size-6"
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
      className="size-5 shrink-0 fill-none stroke-[#ff5a2b] stroke-2 sm:size-6"
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
      className="size-5 shrink-0 fill-none stroke-[#ff5a2b] stroke-2 sm:size-6"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

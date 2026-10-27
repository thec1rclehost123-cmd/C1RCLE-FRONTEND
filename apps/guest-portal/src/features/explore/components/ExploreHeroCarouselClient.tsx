'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { EventArtworkFallback } from './EventArtworkFallback';

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
    <div className="relative z-10">
      <div
        key={`${event.id}-ambient`}
        aria-hidden="true"
        className="explore-hero-ambient pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#080605] blur-[42px] sm:blur-[64px]"
      >
        {event.image === '/c1rcle-logo.webp' ? (
          <div
            aria-hidden="true"
            className="absolute inset-[-12%] bg-[radial-gradient(ellipse_at_52%_48%,rgba(255,100,45,0.42)_0%,rgba(103,42,20,0.34)_28%,rgba(18,13,11,0.84)_68%,#080605_100%)]"
          >
            <div className="absolute -right-[12%] top-[8%] aspect-square w-[72%] rounded-full border border-[#ff6b4a]/30 shadow-[0_0_90px_rgba(255,90,43,0.18)]" />
          </div>
        ) : (
          <Image
            src={event.image}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="scale-[1.12] object-cover brightness-[0.82] saturate-[1.25]"
          />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_24%,transparent_0%,rgba(0,0,0,0.22)_68%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      <div
        ref={carouselRef}
        role="region"
        aria-label="Featured event carousel"
        aria-roledescription="carousel"
        className="relative min-h-[76svh] overflow-hidden sm:min-h-[84svh] lg:min-h-[min(90svh,980px)]"
      >
        <div
          key={`${event.id}-artwork`}
          className="explore-hero-background-reveal absolute -inset-[6%] overflow-hidden blur-[60px]"
        >
          {event.image === '/c1rcle-logo.webp' ? (
            <EventArtworkFallback startsAt={event.startsAt} category={event.category} hero />
          ) : (
            <Image
              src={event.image}
              alt={`${event.title} featured poster`}
              fill
              unoptimized
              preload={activeIndex === 0}
              sizes="100vw"
              className="scale-[1.12] object-cover object-center brightness-[0.48] saturate-[1.1]"
            />
          )}
        </div>
        <div className="explore-hero-overlay-fade pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#080605_0%,rgba(8,6,5,0.86)_22%,rgba(8,6,5,0.48)_48%,rgba(8,6,5,0.1)_82%,rgba(8,6,5,0.04)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(8,6,5,0.48)_0%,rgba(8,6,5,0.05)_26%,rgba(8,6,5,0.5)_58%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_55%_35%,transparent_24%,rgba(0,0,0,0.24)_75%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-transparent via-[#080605]/40 to-transparent sm:h-[64%]" />

        {/* Left Side Content Info */}
        <div
          key={`${event.id}-copy`}
          className="relative z-20 mx-auto flex min-h-[76svh] w-full max-w-[1600px] flex-col justify-end gap-5 px-6 pb-28 pt-40 sm:min-h-[84svh] sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-12 sm:pb-44 sm:pt-28 lg:min-h-[min(90svh,980px)] lg:px-[6%]"
        >
          <div
            role="img"
            aria-label={`${event.title} poster`}
            className="explore-hero-copy-reveal relative order-1 mx-auto aspect-[4/5] w-[min(42vw,190px)] shrink-0 overflow-hidden rounded-[1.2rem] border border-white/20 bg-black/30 shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:mx-0 sm:w-[min(34vw,380px)] md:w-[min(32vw,430px)] xl:w-[min(30vw,500px)]"
          >
            {event.image === '/c1rcle-logo.webp' ? (
              <EventArtworkFallback startsAt={event.startsAt} category={event.category} />
            ) : (
              <Image
                src={event.image}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 639px) 42vw, (max-width: 1279px) 32vw, 500px"
                className="object-cover"
              />
            )}
          </div>

          <div className="order-2 w-full sm:min-w-0 sm:flex-1 lg:max-w-[54rem]">
            <h1 className="explore-hero-copy-reveal explore-hero-delay-2 mt-1 max-w-[18ch] text-[clamp(2rem,9vw,3rem)] font-black uppercase leading-[0.94] tracking-[-0.05em] text-white drop-shadow-[0_14px_42px_rgba(0,0,0,0.7)] sm:mt-0 sm:text-[clamp(2.5rem,4vw,4.5rem)]">
              {event.title}
            </h1>

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

            {event.summary ? (
              <p className="explore-hero-copy-reveal mt-4 max-w-xl text-sm leading-6 text-white/75">
                {event.summary}
              </p>
            ) : null}

            <div className="explore-hero-copy-reveal explore-hero-delay-4 mt-6 flex flex-wrap items-center gap-2.5 sm:mt-8 sm:gap-3">
              <Link
                href={`/event/${event.slug}`}
                className="inline-flex min-h-13 items-center justify-center rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[0_12px_35px_rgba(255,255,255,0.14)] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:min-h-14 sm:px-8 sm:text-xs"
              >
                Get tickets
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrow & Dots Controls */}
        <div className="absolute inset-x-0 bottom-9 z-30 flex items-center justify-center gap-2 sm:inset-x-auto sm:right-[6%] sm:bottom-28 sm:gap-3">
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

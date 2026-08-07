'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import type { HomeFeaturedDropsContent } from '../types/home.types';
import type { ExploreEvent } from '@/features/explore/types/explore.types';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const priceFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const autoplayDelayMs = 6500;
const swipeThresholdPx = 48;

export function HomeFeaturedDropsClient({
  content,
  events,
}: {
  content: HomeFeaturedDropsContent;
  events: readonly ExploreEvent[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (events.length < 2 || paused || reducedMotion) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % events.length);
    }, autoplayDelayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, events.length, paused]);

  if (events.length === 0) return null;

  const event = events[activeIndex];
  if (!event) return null;

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + events.length) % events.length);
  };
  const showNext = () => {
    setActiveIndex((current) => (current + 1) % events.length);
  };

  const priceLabel = event.price
    ? `From ${priceFormatter.format(event.price.amountPaise / 100)}`
    : 'Free entry';

  return (
    <section
      id="featured-drops"
      aria-labelledby="featured-drops-heading"
      className="relative overflow-hidden border-t border-white/10 bg-[#050505] py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(255,68,0,0.16),transparent_32%),radial-gradient(circle_at_82%_62%,rgba(145,83,190,0.16),transparent_35%)]" />
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-9 max-w-2xl">
          <p className="text-[9px] font-black uppercase tracking-[0.32em] text-[#ff6b4a]">
            {content.eyebrow}
          </p>
          <h2
            id="featured-drops-heading"
            className="mt-4 text-4xl font-black uppercase tracking-[-0.055em] text-white sm:text-6xl"
          >
            {content.title}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">{content.description}</p>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured drops carousel"
          aria-live={paused ? 'polite' : 'off'}
          onPointerDown={(event) => {
            pointerStartX.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (pointerStartX.current === null) return;
            const distance = event.clientX - pointerStartX.current;
            pointerStartX.current = null;
            if (Math.abs(distance) < swipeThresholdPx) return;
            if (distance < 0) showNext();
            else showPrevious();
          }}
          onPointerCancel={() => {
            pointerStartX.current = null;
          }}
          className="group relative isolate min-h-[34rem] touch-pan-y overflow-hidden rounded-[2rem] border border-white/15 bg-[#111] shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:min-h-[38rem] sm:rounded-[2.5rem] lg:min-h-[40rem]"
        >
          <Image
            key={event.image}
            src={event.image}
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover opacity-65 transition-opacity duration-500 motion-reduce:transition-none"
          />
          <div className="absolute inset-0 -z-0 bg-gradient-to-t from-black via-black/55 to-black/10 lg:bg-gradient-to-r lg:from-black lg:via-black/55 lg:to-transparent" />

          <div className="relative z-10 flex min-h-[34rem] max-w-3xl flex-col justify-end px-6 pb-24 pt-16 sm:min-h-[38rem] sm:px-10 sm:pb-28 lg:min-h-[40rem] lg:px-14">
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em]">
              <span className="rounded-full border border-[#ff6b4a]/50 bg-[#ff4400]/15 px-3 py-1.5 text-[#ff8a70]">
                Drop {String(activeIndex + 1).padStart(2, '0')}
              </span>
              <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-white/70 backdrop-blur-md">
                {event.category}
              </span>
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.28em] text-white/55">
              {dateFormatter.format(new Date(event.startsAt))} ·{' '}
              {timeFormatter.format(new Date(event.startsAt))} · {event.city}
            </p>
            <h3
              key={event.id}
              className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.06em] text-white motion-safe:animate-[checkout-number-roll-up_300ms_cubic-bezier(0.22,1,0.36,1)] sm:text-7xl lg:text-8xl"
            >
              {event.title}
            </h3>
            <p className="mt-5 text-sm font-bold text-white/70 sm:text-base">
              {event.venue} · {priceLabel}
            </p>
            <Link
              href={`/event/${event.slug}`}
              className="mt-7 inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-black transition-transform hover:scale-[1.03] active:scale-[0.98] motion-reduce:transition-none"
            >
              {content.eventCtaLabel}
            </Link>
          </div>

          <div className="absolute inset-x-6 bottom-6 z-20 flex items-center justify-between gap-4 sm:inset-x-10 sm:bottom-8 lg:inset-x-14">
            <div className="flex items-center gap-2" aria-label="Choose featured drop">
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
                    index === activeIndex
                      ? 'w-10 bg-[#ff4400]'
                      : 'w-2 bg-white/35 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={paused ? 'Play featured drops' : 'Pause featured drops'}
                aria-pressed={paused}
                onClick={() => {
                  setPaused((current) => !current);
                }}
                className="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-black/45 px-3 text-[8px] font-black uppercase tracking-[0.15em] text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black sm:px-4 sm:text-[9px] sm:tracking-[0.18em]"
              >
                {paused ? 'Play' : 'Pause'}
              </button>
              <button
                type="button"
                aria-label="Previous featured drop"
                onClick={showPrevious}
                className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xl text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                aria-label="Next featured drop"
                onClick={showNext}
                className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xl text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

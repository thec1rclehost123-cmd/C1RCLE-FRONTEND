import Link from 'next/link';

import { HomeBackgroundVideoClient } from './HomeBackgroundVideoClient';

import type { HomeHeroContent } from '../types/home.types';

export function HomeHero({ hero }: { hero: HomeHeroContent }) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-black px-4 pb-24 pt-28 text-center sm:px-6 sm:pt-32"
    >
      <picture className="absolute inset-0 -z-30">
        <source media="(max-width: 639px)" srcSet={hero.mobilePosterSrc} />
        {/* The source assets are deliberately pre-compressed page media. */}
        <img
          src={hero.desktopPosterSrc}
          alt=""
          width={1024}
          height={576}
          fetchPriority="high"
          className="size-full object-cover"
        />
      </picture>

      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <HomeBackgroundVideoClient src={hero.videoSrc} />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.24)_42%,rgba(0,0,0,0.92)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.62)_100%)]" />
      <div className="absolute left-[12%] top-[28%] -z-10 size-64 rounded-full bg-[#ff4400]/15 blur-[110px] sm:size-96" />
      <div className="absolute bottom-[18%] right-[12%] -z-10 size-64 rounded-full bg-purple-500/15 blur-[110px] sm:size-96" />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
        <p className="text-[9px] font-black uppercase tracking-[0.38em] text-white/55 sm:text-[10px]">
          {hero.eyebrow}
        </p>
        <h1
          id="home-hero-heading"
          className="mt-5 text-[clamp(3.8rem,13vw,10rem)] font-black uppercase leading-[0.78] tracking-[-0.075em] text-white drop-shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
        >
          {hero.title}
        </h1>

        <p className="mt-9 rounded-full border border-white/20 bg-black/25 px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white backdrop-blur-xl sm:px-8 sm:text-xs">
          {hero.tagline}
        </p>
        <p className="mt-5 max-w-xl text-sm font-medium leading-6 text-white/65 sm:text-base sm:leading-7">
          {hero.description}
        </p>

        <Link
          href={hero.ctaHref}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-black transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98] motion-reduce:transition-none"
        >
          {hero.ctaLabel}
        </Link>
      </div>

      <a
        href="#featured-events"
        className="absolute bottom-7 left-1/2 flex min-h-11 -translate-x-1/2 flex-col items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-white/45 transition-colors hover:text-white"
      >
        Scroll to discover
        <span
          aria-hidden="true"
          className="h-5 w-px origin-top animate-pulse bg-gradient-to-b from-white to-transparent motion-reduce:animate-none"
        />
      </a>
    </section>
  );
}

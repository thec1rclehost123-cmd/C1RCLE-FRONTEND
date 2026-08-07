import Link from 'next/link';

import { HomeBackgroundVideoClient } from './HomeBackgroundVideoClient';

import type { HomeHeroContent } from '../types/home.types';

export function HomeHero({ hero }: { hero: HomeHeroContent }) {
  return (
    <section
      id="tonight"
      aria-labelledby="home-hero-heading"
      className="relative isolate flex h-[100svh] min-h-[560px] items-center justify-center overflow-hidden bg-black px-4 pt-16 text-center md:pt-28"
    >
      <picture className="absolute inset-0 -z-30">
        <source media="(max-width: 639px)" srcSet={hero.mobilePosterSrc} />
        {/* The source assets are deliberately pre-compressed page media. */}
        <img
          src={hero.desktopPosterSrc}
          alt=""
          width={1280}
          height={720}
          fetchPriority="high"
          className="size-full object-cover"
        />
      </picture>

      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <HomeBackgroundVideoClient
          desktopSrc={hero.desktopVideoSrc}
          mobileSrc={hero.mobileVideoSrc}
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/25 to-black" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/50 via-transparent to-black/40" />
      <div className="nightlife-grain pointer-events-none absolute inset-0 -z-10 opacity-10 mix-blend-overlay" />
      <div className="pointer-events-none absolute left-1/4 top-1/4 -z-10 size-64 rounded-full bg-[#f44a22]/15 blur-[100px] md:size-96 md:blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 -z-10 size-64 rounded-full bg-[#9b3cff]/10 blur-[100px] md:size-96 md:blur-[120px]" />

      <div className="mx-auto w-full max-w-7xl space-y-5 md:space-y-7">
        <h1
          id="home-hero-heading"
          className="home-hero-title animate-home-scale-in text-[3.2rem] font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8.25rem]"
        >
          {hero.title}
        </h1>
        <div className="animate-home-line-reveal mx-auto h-1 w-24 bg-gradient-to-r from-transparent via-[#f44a22] to-transparent shadow-[0_0_20px_rgba(244,74,34,0.8)] md:w-36" />
        <p className="animate-home-fade-in mx-auto max-w-[320px] px-2 text-sm font-medium leading-relaxed text-white/75 md:max-w-3xl md:text-lg">
          {hero.description}
        </p>
        <div className="animate-home-fade-up flex flex-col items-center justify-center gap-4 pt-3 sm:flex-row">
          <Link
            href={hero.ctaHref}
            className="group relative w-full overflow-hidden rounded-full bg-white px-8 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.45)] sm:w-auto md:px-10 md:py-5 md:text-sm motion-reduce:transition-none"
          >
            <span className="relative z-10">{hero.ctaLabel}</span>
          </Link>
          <Link
            href="#story"
            className="w-full rounded-full border border-white/[0.18] bg-white/[0.07] px-8 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl transition-all duration-300 hover:border-[#f44a22]/60 hover:bg-[#f44a22]/15 sm:w-auto md:px-10 md:py-5 md:text-sm motion-reduce:transition-none"
          >
            See the app
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-black via-black/60 to-transparent md:h-32" />
    </section>
  );
}

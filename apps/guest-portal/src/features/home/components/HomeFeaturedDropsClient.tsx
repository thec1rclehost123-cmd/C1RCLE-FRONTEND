'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';

import type { HomeFeaturedDropsContent } from '../types/home.types';

const featuredDrops = [
  {
    id: 'velvet-nights',
    image: '/home/featured-drops/velvet-nights.webp',
    title: 'Velvet Nights',
    venue: 'THE C1RCLE',
  },
  {
    id: 'aqua-sundays',
    image: '/home/featured-drops/aqua-sundays.webp',
    title: 'Aqua Sundays',
    venue: 'THE C1RCLE',
  },
  {
    id: 'red-room',
    image: '/home/featured-drops/red-room.webp',
    title: 'Red Room',
    venue: 'THE C1RCLE',
  },
  {
    id: 'neon-district',
    image: '/home/featured-drops/neon-district.webp',
    title: 'Neon District',
    venue: 'Koregaon Park',
  },
  {
    id: 'house-of-afro',
    image: '/home/featured-drops/house-of-afro.webp',
    title: 'The House of Afro',
    venue: 'Koregaon Park',
  },
  {
    id: 'afterhours',
    image: '/home/featured-drops/afterhours.webp',
    title: 'Afterhours',
    venue: 'Secret Location',
  },
  {
    id: 'eclipse',
    image: '/home/featured-drops/eclipse.webp',
    title: 'Eclipse',
    venue: 'THE C1RCLE',
  },
  {
    id: 'midnight-club',
    image: '/home/featured-drops/midnight-club.webp',
    title: 'Midnight Club',
    venue: 'Koregaon Park',
  },
  {
    id: 'no-signal',
    image: '/home/featured-drops/no-signal.webp',
    title: 'No Signal',
    venue: 'Underground',
  },
] as const;

const autoScrollPixelsPerSecond = 42;

function wrapOffset(value: number, length: number) {
  return ((((value + length / 2) % length) + length) % length) - length / 2;
}

function getCardMetrics(stageWidth: number) {
  const mobile = stageWidth < 640;
  const cardWidth = Math.min(Math.max(stageWidth * (mobile ? 0.44 : 0.24), 130), 330);
  const cardHeight = Math.round(cardWidth * 1.42);
  const radius = Math.max(stageWidth * (mobile ? 0.54 : 0.48), cardWidth * (mobile ? 1.7 : 1.95));

  return { cardHeight, cardWidth, radius };
}

export function HomeFeaturedDropsClient({ content }: { content: HomeFeaturedDropsContent }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const titleParts = useMemo(() => {
    const words = content.title.trim().split(/\s+/);
    return {
      accent: words.pop() ?? '',
      lead: words.join(' '),
    };
  }, [content.title]);

  const rail = useMemo(() => featuredDrops.map((event) => ({ event, key: event.id })), []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || rail.length === 0) return;
    const cards = cardRefs.current;

    const reducedMotionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let reducedMotion = reducedMotionQuery?.matches ?? false;
    let stageVisible = true;
    let animationFrame = 0;
    let animationRunning = false;
    let previousTime = 0;
    let progress = 0;

    const positionCards = () => {
      const { cardHeight, cardWidth, radius } = getCardMetrics(stage.clientWidth);
      const angleStep = stage.clientWidth < 640 ? 0.52 : stage.clientWidth < 1024 ? 0.4 : 0.285;

      cards.forEach((card, index) => {
        if (!card) return;

        const offset = wrapOffset(index - progress, rail.length);
        const angle = Math.max(-1.22, Math.min(1.22, offset * angleStep));
        const distance = Math.abs(angle) / 1.22;
        const x = Math.sin(angle) * radius;
        const y = (1 - Math.cos(angle)) * cardHeight * 0.34;
        const z = (Math.cos(angle) - 1) * radius * 0.84;
        const rotateY = (-angle * 180) / Math.PI;
        const rotateZ = Math.max(-4.5, Math.min(4.5, (angle * 180 * 0.065) / Math.PI));
        const scale = 1 - distance * 0.1;
        const opacity = Math.max(0.2, 1 - distance * 0.7);

        card.style.width = String(cardWidth) + 'px';
        card.style.height = String(cardHeight) + 'px';
        card.style.opacity = String(opacity);
        card.style.zIndex = String(Math.round(300 - distance * 180));
        card.style.pointerEvents = distance > 0.98 ? 'none' : 'auto';
        card.style.transform = [
          'translate3d(calc(-50% + ',
          String(x),
          'px), calc(-50% + ',
          String(y),
          'px), ',
          String(z),
          'px) rotateY(',
          String(rotateY),
          'deg) rotateZ(',
          String(rotateZ),
          'deg) scale(',
          String(scale),
          ')',
        ].join('');
      });
    };

    const animate = (time: number) => {
      if (reducedMotion || !stageVisible) {
        animationRunning = false;
        return;
      }

      if (previousTime === 0) previousTime = time;
      const delta = Math.min(time - previousTime, 64);
      previousTime = time;

      const { cardWidth } = getCardMetrics(stage.clientWidth);
      progress =
        (progress + (delta / 1000) * (autoScrollPixelsPerSecond / cardWidth)) % rail.length;
      positionCards();

      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (animationRunning || reducedMotion || !stageVisible) return;
      animationRunning = true;
      previousTime = 0;
      animationFrame = window.requestAnimationFrame(animate);
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      positionCards();
      if (reducedMotion) {
        window.cancelAnimationFrame(animationFrame);
        animationRunning = false;
      } else {
        startAnimation();
      }
    };

    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(positionCards) : null;
    const visibilityObserver =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            ([entry]) => {
              stageVisible = entry?.isIntersecting ?? false;
              previousTime = 0;
              if (stageVisible) {
                startAnimation();
              } else {
                window.cancelAnimationFrame(animationFrame);
                animationRunning = false;
              }
            },
            { rootMargin: '120px 0px' },
          )
        : null;

    positionCards();
    resizeObserver?.observe(stage);
    visibilityObserver?.observe(stage);
    if (!resizeObserver) window.addEventListener('resize', positionCards);
    reducedMotionQuery?.addEventListener('change', handleMotionPreference);
    startAnimation();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener('resize', positionCards);
      reducedMotionQuery?.removeEventListener('change', handleMotionPreference);
      cards.forEach((card) => {
        card?.style.removeProperty('will-change');
      });
    };
  }, [rail]);

  return (
    <section
      id="featured-drops"
      aria-labelledby="featured-drops-heading"
      className="relative z-10 overflow-hidden bg-black py-20 text-white"
    >
      <div className="relative z-10 flex flex-col items-center px-4 text-center sm:px-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[8px] font-black uppercase tracking-[0.3em] text-[#ff6b4a] sm:text-[9px]">
          <span className="size-1.5 rounded-full bg-[#ff4400]" />
          {content.eyebrow}
        </p>
        <h2
          id="featured-drops-heading"
          className="mt-5 text-4xl font-black uppercase leading-none tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl"
        >
          {titleParts.lead} <span className="text-[#ff5a2b]">{titleParts.accent}</span>
        </h2>
        <p className="sr-only">{content.description}</p>
      </div>

      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured drops carousel"
        className="relative mx-auto mt-7 h-[22rem] w-full select-none overflow-hidden [perspective:1800px] sm:h-[28rem] lg:mt-9 lg:h-[34rem]"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[420] w-12 bg-gradient-to-r from-[#030303] via-[#030303]/90 to-transparent sm:w-28 lg:w-44" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[420] w-12 bg-gradient-to-l from-[#030303] via-[#030303]/90 to-transparent sm:w-28 lg:w-44" />
        <div className="pointer-events-none absolute left-1/2 top-[10%] h-[105%] w-[145%] -translate-x-1/2 rounded-[999px] border border-white/[0.045]" />

        {rail.map(({ event, key }, index) => (
          <Link
            key={key}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            href="/explore"
            aria-label={`Open ${event.title}`}
            className="group absolute left-1/2 top-[43%] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0807] text-left shadow-[0_28px_75px_rgba(0,0,0,0.62)] outline-none [transform-style:preserve-3d] transition-[border-color,box-shadow] duration-300 hover:border-[#ff6b4a]/45 hover:shadow-[0_34px_90px_rgba(255,68,0,0.16)] focus-visible:ring-2 focus-visible:ring-[#ff6b4a] motion-reduce:transition-none"
          >
            <Image
              src={event.image}
              alt=""
              fill
              sizes="(max-width: 640px) 200px, (max-width: 1024px) 258px, 310px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/90" />
            <div className="absolute inset-[1px] rounded-[1.45rem] border border-[#ff6b4a]/20" />

            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-[#ff4b1f]" />
              Live
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#ff8060] sm:text-[9px]">
                {event.venue}
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-3xl">
                {event.title}
              </h3>
              <div className="mt-4 flex items-center justify-between gap-3 text-[8px] font-black uppercase tracking-[0.2em] text-white/60 sm:text-[9px]">
                <span>Featured Drop</span>
                <span className="text-[#ff8a6c]">Enter</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

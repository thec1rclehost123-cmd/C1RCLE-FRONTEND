import Image from 'next/image';

import type { RefObject } from 'react';

const screenAssets = [
  { src: '/app/screens/explore.webp', alt: 'THE C1RCLE mobile Explore screen with live events' },
  { src: '/app/screens/event.webp', alt: 'THE C1RCLE mobile event detail screen' },
  { src: '/app/screens/venues.webp', alt: 'THE C1RCLE mobile venue discovery screen' },
  { src: '/app/screens/checkout.webp', alt: 'THE C1RCLE mobile ticket selection screen' },
  { src: '/app/screens/chat.webp', alt: 'THE C1RCLE mobile Chat screen' },
  { src: '/app/screens/tickets.webp', alt: 'THE C1RCLE mobile Tickets screen' },
] as const;

export function HomePhoneMockup({
  phoneRef,
  screen1Ref,
  screen2Ref,
  screen3Ref,
  screen4Ref,
  screen5Ref,
  screen6Ref,
  activeScreen,
}: {
  phoneRef: RefObject<HTMLDivElement | null>;
  screen1Ref: RefObject<HTMLDivElement | null>;
  screen2Ref: RefObject<HTMLDivElement | null>;
  screen3Ref: RefObject<HTMLDivElement | null>;
  screen4Ref: RefObject<HTMLDivElement | null>;
  screen5Ref: RefObject<HTMLDivElement | null>;
  screen6Ref: RefObject<HTMLDivElement | null>;
  activeScreen: number;
}) {
  const shouldMountScreen = (screenIndex: number) =>
    Math.abs(screenIndex - activeScreen) <= 1;

  const renderScreen = (screenIndex: number) => {
    if (!shouldMountScreen(screenIndex)) return null;
    const screen = screenAssets[screenIndex];
    if (!screen) return null;

    return (
      <Image
        src={screen.src}
        alt={screen.alt}
        fill
        sizes="(max-width: 768px) 52vw, 330px"
        className="object-cover"
        priority={screenIndex === 0}
      />
    );
  };

  return (
    <div aria-hidden="true" inert className="relative [perspective:1200px]">
      <div
        aria-hidden="true"
        className="absolute -bottom-12 left-1/2 h-16 w-[72%] -translate-x-1/2 rounded-full bg-black/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -inset-5 rounded-[58px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_50%_50%,rgba(244,74,34,0.18),transparent_62%)] blur-xl"
      />
      <div
        ref={phoneRef}
        className="relative aspect-[393/852] h-[62vh] min-h-[405px] max-h-[680px] rounded-[50px] border border-white/[0.18] bg-[linear-gradient(115deg,#1a1a1a_0%,#030303_28%,#121212_50%,#000_76%,#2a211d_100%)] p-[9px] shadow-[0_54px_130px_rgba(0,0,0,0.95),-22px_30px_70px_rgba(244,74,34,0.16),18px_-18px_56px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.28),inset_12px_0_22px_rgba(255,255,255,0.05),inset_-14px_0_24px_rgba(0,0,0,0.88)] md:h-[66vh] xl:h-[69vh] max-[460px]:h-[60vh] max-[460px]:min-h-[395px]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-[46px] border border-white/[0.08]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-10 left-0 w-3 rounded-l-[46px] bg-gradient-to-r from-white/[0.20] to-transparent blur-[1px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-12 right-0 w-4 rounded-r-[46px] bg-gradient-to-l from-black/90 to-transparent"
        />
        <div className="absolute -left-1 top-32 h-16 w-1 rounded-full bg-gradient-to-b from-white/[0.32] via-white/[0.10] to-black/50 shadow-[0_0_10px_rgba(255,255,255,0.14)]" />
        <div className="absolute -right-1 top-44 h-24 w-1 rounded-full bg-gradient-to-b from-white/[0.20] via-white/[0.08] to-black/60" />
        <div className="relative h-full overflow-hidden rounded-[40px] border border-white/[0.12] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_18px_30px_rgba(255,255,255,0.04),inset_0_-28px_42px_rgba(0,0,0,0.82)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(116deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.08)_16%,transparent_34%,transparent_64%,rgba(255,255,255,0.08)_100%)] opacity-35 mix-blend-screen"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 top-0 z-30 h-full w-28 rotate-12 bg-white/10 blur-2xl"
          />

          {/* Screen 1: Discover New Events */}
          <div
            ref={screen1Ref}
            className="absolute inset-0 translate-x-0"
          >
            {renderScreen(0)}
          </div>

          {/* Screen 2: Interested People */}
          <div
            ref={screen2Ref}
            className="absolute inset-0 translate-x-full"
          >
            {renderScreen(1)}
          </div>

          {/* Screen 3: Ask Outs */}
          <div
            ref={screen3Ref}
            className="absolute inset-0 translate-x-full"
          >
            {renderScreen(2)}
          </div>

          {/* Screen 4: Buy, Share, Transfer Tickets */}
          <div
            ref={screen4Ref}
            className="absolute inset-0 translate-x-full"
          >
            {renderScreen(3)}
          </div>

          {/* Screen 5: Event Only Group Chat */}
          <div
            ref={screen5Ref}
            className="absolute inset-0 translate-x-full"
          >
            {renderScreen(4)}
          </div>

          {/* Screen 6: Priority Passes */}
          <div
            ref={screen6Ref}
            className="absolute inset-0 translate-x-full"
          >
            {renderScreen(5)}
          </div>
        </div>
      </div>
    </div>
  );
}

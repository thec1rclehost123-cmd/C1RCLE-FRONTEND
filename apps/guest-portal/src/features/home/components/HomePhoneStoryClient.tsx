'use client';

import { useEffect, useRef, useState } from 'react';

import { HomePhoneMockup } from './HomePhoneMockup';

const sideLabels = [
  { tag: 'Explore', text: 'Find live events', side: 'left' },
  { tag: 'Events', text: 'See every detail', side: 'right' },
  { tag: 'Venues', text: 'Discover your city', side: 'left' },
  { tag: 'Tickets', text: 'Choose your entry', side: 'right' },
  { tag: 'Chat', text: 'Meet your people', side: 'left' },
  { tag: 'Wallet', text: 'Keep tickets private', side: 'right' },
] as const;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

export function HomePhoneStoryClient() {
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const vibeRef = useRef<HTMLSpanElement>(null);
  const connectRef = useRef<HTMLSpanElement>(null);
  const experienceRef = useRef<HTMLSpanElement>(null);
  const sideLabelsContainerRef = useRef<HTMLDivElement>(null);
  const mobileLabelRef = useRef<HTMLDivElement>(null);
  const tutorialControlsRef = useRef<HTMLDivElement>(null);
  const screen1Ref = useRef<HTMLDivElement>(null);
  const screen2Ref = useRef<HTMLDivElement>(null);
  const screen3Ref = useRef<HTMLDivElement>(null);
  const screen4Ref = useRef<HTMLDivElement>(null);
  const screen5Ref = useRef<HTMLDivElement>(null);
  const screen6Ref = useRef<HTMLDivElement>(null);
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const phone = phoneRef.current;
    const title = titleRef.current;
    const words = [vibeRef.current, connectRef.current, experienceRef.current];
    const sideContainer = sideLabelsContainerRef.current;
    const mobileLabel = mobileLabelRef.current;
    const tutorialControls = tutorialControlsRef.current;
    const screens = [
      screen1Ref.current,
      screen2Ref.current,
      screen3Ref.current,
      screen4Ref.current,
      screen5Ref.current,
      screen6Ref.current,
    ];

    if (!section || !phone || words.some((word) => !word) || screens.some((screen) => !screen)) {
      return;
    }

    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let reducedMotion = motionQuery?.matches ?? false;
    let frame = 0;
    let lastActiveScreen = -1;
    let sectionActive = false;
    let pageVisible = !document.hidden;
    let sectionTop = 0;
    let scrollableDistance = 1;
    let lastProgress = -1;

    const setCompositorHints = (active: boolean) => {
      phone.style.willChange = active ? 'transform, opacity' : 'auto';
      if (title) title.style.willChange = active ? 'transform, opacity' : 'auto';
      words.forEach((word) => {
        if (word) word.style.willChange = active ? 'transform, opacity' : 'auto';
      });
      if (sideContainer) sideContainer.style.willChange = active ? 'opacity' : 'auto';
      if (mobileLabel) mobileLabel.style.willChange = active ? 'opacity' : 'auto';
      if (tutorialControls) tutorialControls.style.willChange = active ? 'opacity' : 'auto';
      screens.forEach((screen) => {
        if (screen) screen.style.willChange = active ? 'transform' : 'auto';
      });
    };

    const measureSection = () => {
      const rect = section.getBoundingClientRect();
      sectionTop = rect.top + window.scrollY;
      scrollableDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      lastProgress = -1;
    };

    const render = () => {
      frame = 0;

      if (reducedMotion) {
        phone.style.opacity = '1';
        phone.style.transform = 'none';
        if (title) title.style.opacity = '1';
        words.forEach((word) => {
          if (!word) return;
          word.style.opacity = '0.15';
          word.style.transform = 'none';
        });
        if (sideContainer) sideContainer.style.opacity = '1';
        if (mobileLabel) mobileLabel.style.opacity = '1';
        if (tutorialControls) {
          tutorialControls.style.opacity = '1';
          tutorialControls.style.pointerEvents = 'auto';
        }
        screens.forEach((screen, index) => {
          if (!screen) return;
          screen.style.transform = `translate3d(${String(index * 100)}%, 0, 0)`;
        });
        if (lastActiveScreen !== 0) {
          lastActiveScreen = 0;
          setActiveScreen(0);
        }
        return;
      }

      if (!sectionActive || !pageVisible) return;

      const progress = clamp((window.scrollY - sectionTop) / scrollableDistance);
      if (Math.abs(progress - lastProgress) < 0.0005) return;
      lastProgress = progress;

      // Phase 01: keep the phone deliberately compact, then bring it forward
      // only after the intro copy has begun to leave the frame.
      const zoomProgress = easeOutCubic(clamp((progress - 0.035) / 0.145));
      const phoneOutro = clamp((progress - 0.94) / 0.06);
      const phoneScale = 0.66 + zoomProgress * 0.34 - phoneOutro * 0.34;
      const phoneY = (1 - zoomProgress) * 38 + phoneOutro * 56;

      phone.style.opacity = String(clamp(1 - phoneOutro));
      phone.style.transform = `translate3d(0, ${String(phoneY)}px, 0) scale(${String(phoneScale)})`;

      // Phase 02: title and oversized background type clear the stage before
      // any tutorial label or screen transition is introduced.
      const textExit = easeOutCubic(clamp((progress - 0.015) / 0.12));

      if (title) {
        title.style.opacity = String(clamp(1 - textExit * 1.15));
        title.style.transform = `translate3d(0, ${String(-textExit * 42)}px, 0) scale(${String(1 - textExit * 0.035)})`;
      }

      words.forEach((word, index) => {
        if (!word) return;
        const direction = index === 1 ? -1 : 1;
        const verticalExit = index === 1 ? 0 : (index === 0 ? -1 : 1) * textExit * 26;
        word.style.opacity = String(clamp((1 - textExit) * (index === 1 ? 0.58 : 0.42)));
        word.style.transform = `translate3d(${String(direction * textExit * 38)}vw, ${String(verticalExit)}px, 0)`;
      });

      // Phase 03: tutorial chrome appears only when the phone has completed
      // its move into the central, full-size reading position.
      const sideLabelOpacity = easeOutCubic(clamp((progress - 0.18) / 0.055));
      if (sideContainer) sideContainer.style.opacity = String(sideLabelOpacity);
      if (mobileLabel) mobileLabel.style.opacity = String(sideLabelOpacity);
      if (tutorialControls) {
        tutorialControls.style.opacity = String(sideLabelOpacity);
        tutorialControls.style.pointerEvents = sideLabelOpacity > 0.7 ? 'auto' : 'none';
      }

      // The first app screen remains still throughout the intro and zoom.
      // Screen-to-screen progress begins only after tutorial labels are visible.
      const screenProgress = clamp((progress - 0.22) / 0.7);
      const rawScreen = screenProgress * (screens.length - 1);
      const nextActiveScreen = Math.min(screens.length - 1, Math.round(rawScreen));

      screens.forEach((screen, index) => {
        if (!screen) return;
        const offset = (index - rawScreen) * 100;
        screen.style.transform = `translate3d(${String(offset)}%, 0, 0)`;
      });

      if (nextActiveScreen !== lastActiveScreen) {
        lastActiveScreen = nextActiveScreen;
        setActiveScreen(nextActiveScreen);
      }
    };

    const scheduleRender = () => {
      if (frame || (!sectionActive && !reducedMotion) || !pageVisible) return;
      frame = window.requestAnimationFrame(render);
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      lastProgress = -1;
      scheduleRender();
    };

    const handleResize = () => {
      measureSection();
      scheduleRender();
    };

    const handleVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (!pageVisible) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      lastProgress = -1;
      scheduleRender();
    };

    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            ([entry]) => {
              sectionActive = entry?.isIntersecting ?? false;
              setCompositorHints(sectionActive);

              if (!sectionActive) {
                window.cancelAnimationFrame(frame);
                frame = 0;
                return;
              }

              measureSection();
              scheduleRender();
            },
            // Start preparing shortly before the story reaches the viewport,
            // but release compositor layers soon after it leaves. The old
            // 50% margin kept several large transformed layers promoted for
            // much longer than the user could see them.
            { rootMargin: '20% 0px' },
          )
        : null;

    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(handleResize) : null;

    measureSection();
    if (reducedMotion) {
      sectionActive = true;
      render();
    }
    if (observer) observer.observe(section);
    else sectionActive = true;
    resizeObserver?.observe(section);
    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionQuery?.addEventListener('change', handleMotionChange);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', scheduleRender);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery?.removeEventListener('change', handleMotionChange);
      setCompositorHints(false);
    };
  }, []);

  const scrollToScreen = (screenIndex: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const scrollableDistance = section.offsetHeight - window.innerHeight;
    const targetProgress = 0.22 + (screenIndex / (sideLabels.length - 1)) * 0.7;
    const targetScrollY = section.offsetTop + targetProgress * scrollableDistance;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  };

  const activeLabel = sideLabels[activeScreen] ?? sideLabels[0];

  return (
    <section
      id="story"
      ref={sectionRef}
      aria-label="The C1RCLE app experience"
      className="relative z-10 h-[420vh] bg-black text-white md:h-[380vh] motion-reduce:h-auto"
    >
      <div className="sticky top-0 flex h-[100svh] min-h-[560px] flex-col items-center justify-between overflow-hidden px-4 pb-6 pt-16 sm:min-h-[660px] md:px-8 motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-[760px]">
        {/* Background Gradients */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(244,74,34,0.2),transparent_34%),linear-gradient(180deg,#000_0%,#070707_46%,#000_100%)]" />
        <div className="nightlife-grain pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay" />

        {/* Ambient Radial Ring */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[54rem] w-[54rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />

        {/* Lifted Header Title (Positioned closer to Navbar, stacked layout) */}
        <div
          ref={titleRef}
          className="pointer-events-none absolute left-1/2 top-[5.5rem] z-30 w-full max-w-4xl -translate-x-1/2 px-6 text-center sm:top-[6rem]"
        >
          <p className="mb-3 text-[8px] font-black uppercase tracking-[0.42em] text-[#ff6b4a] sm:text-[9px]">
            Discover life offline
          </p>
          <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 font-black uppercase leading-[0.88] tracking-[-0.065em] text-white sm:gap-x-4">
            <span className="text-[clamp(2.6rem,6vw,5.25rem)]">THE C1RCLE</span>
            <span className="text-[clamp(2.6rem,6vw,5.25rem)] text-[#FF5A2B]">APP</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[11px] font-semibold leading-5 tracking-[0.05em] text-white/52 sm:text-xs sm:leading-6">
            Your direct key to curated nightlife, exclusive rooms, and instant guestlist entry.
          </p>
        </div>

        {/* Background Watermark Text: VIBE, CONNECT, EXPERIENCE */}
        <div className="pointer-events-none absolute inset-x-0 top-[29%] z-0 flex justify-center overflow-hidden text-center sm:top-[30%]">
          <h2 className="flex flex-col items-center text-[clamp(6rem,15vw,12rem)] font-black uppercase leading-[0.88] tracking-[-0.075em]">
            <span ref={vibeRef} className="inline-block px-4 text-white/35">
              VIBE
            </span>
            <span ref={connectRef} className="inline-block px-4 text-[#f44a22]">
              CONNECT
            </span>
            <span ref={experienceRef} className="inline-block px-4 text-white/72">
              EXPERIENCE
            </span>
          </h2>
        </div>

        {/* Desktop Side Feature Labels */}
        <div
          ref={sideLabelsContainerRef}
          className="pointer-events-none absolute inset-0 z-20 hidden opacity-0 lg:block"
        >
          <div className="relative mx-auto flex h-full w-full max-w-7xl items-center px-6 lg:px-24">
            <div className="w-[220px] xl:w-[260px]">
              {activeLabel.side === 'left' ? <StoryLabel label={activeLabel} /> : null}
            </div>
            <div className="flex-1" />
            <div className="w-[220px] text-right xl:w-[260px]">
              {activeLabel.side === 'right' ? (
                <StoryLabel label={activeLabel} align="right" />
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile Header Label */}
        <div
          ref={mobileLabelRef}
          className="pointer-events-none relative z-20 mb-2 flex h-[50px] w-full flex-col items-center justify-center text-center opacity-0 lg:hidden"
        >
          <StoryLabel label={activeLabel} compact />
        </div>

        {/* Phone Mockup (Starts compact at scale 0.68, sitting cleanly under subtext) */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pt-[8vh] sm:pt-[10vh]">
          <div className="relative flex scale-100 justify-center">
            <HomePhoneMockup
              phoneRef={phoneRef}
              screen1Ref={screen1Ref}
              screen2Ref={screen2Ref}
              screen3Ref={screen3Ref}
              screen4Ref={screen4Ref}
              screen5Ref={screen5Ref}
              screen6Ref={screen6Ref}
              activeScreen={activeScreen}
            />
          </div>
        </div>

        {/* Interactive Screen Navigation Dots */}
        <div
          ref={tutorialControlsRef}
          className="pointer-events-none relative z-30 mb-2 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 opacity-0 backdrop-blur-xl"
        >
          {sideLabels.map((item, index) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => {
                scrollToScreen(index);
              }}
              aria-label={`Jump to ${item.text}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeScreen === index ? 'w-8 bg-[#FF4400]' : 'w-2.5 bg-white/20 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryLabel({
  align = 'left',
  compact = false,
  label,
}: {
  align?: 'left' | 'right';
  compact?: boolean;
  label: (typeof sideLabels)[number];
}) {
  return (
    <div key={label.tag} className="animate-home-label-in" aria-live="polite">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6b4a] sm:mb-2">
        {label.tag}
      </p>
      <h3
        className={`${compact ? 'text-2xl sm:text-3xl' : 'text-2xl lg:text-3xl'} font-heading font-black uppercase leading-none tracking-tight text-white`}
      >
        {label.text}
      </h3>
      {!compact ? (
        <div
          className={`mt-3 h-0.5 w-12 rounded-full ${
            align === 'right'
              ? 'ml-auto bg-gradient-to-l from-[#f44a22] to-transparent'
              : 'bg-gradient-to-r from-[#f44a22] to-transparent'
          }`}
        />
      ) : null}
    </div>
  );
}

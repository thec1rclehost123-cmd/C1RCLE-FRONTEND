'use client';

import { useEffect, useRef, useState } from 'react';

import { HomePhoneMockup } from './HomePhoneMockup';

const sideLabels = [
  { tag: 'Explore', text: 'Discover new events', side: 'left' },
  { tag: 'Social', text: 'Interested people', side: 'right' },
  { tag: 'Connect', text: 'Ask outs', side: 'left' },
  { tag: 'Tickets', text: 'Your ticket wallet', side: 'right' },
  { tag: 'Chat', text: 'Event only group chat', side: 'left' },
  { tag: 'VIP', text: 'Priority passes', side: 'right' },
] as const;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function HomePhoneStoryClient() {
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const vibeRef = useRef<HTMLSpanElement>(null);
  const connectRef = useRef<HTMLSpanElement>(null);
  const experienceRef = useRef<HTMLSpanElement>(null);
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
    const words = [vibeRef.current, connectRef.current, experienceRef.current];
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

    const render = () => {
      frame = 0;

      if (reducedMotion) {
        phone.style.opacity = '1';
        phone.style.transform = 'none';
        words.forEach((word) => {
          if (!word) return;
          word.style.opacity = '0.18';
          word.style.transform = 'none';
        });
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

      const rect = section.getBoundingClientRect();
      const scrollableDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / scrollableDistance);
      const phoneIntro = clamp(progress / 0.12);
      const textExit = clamp((progress - 0.12) / 0.12);
      const phoneOutro = clamp((progress - 0.92) / 0.08);
      const phoneScale = 0.85 + phoneIntro * 0.15 - phoneOutro * 0.38;
      const phoneY = (1 - phoneIntro) * 70 + phoneOutro * 60;

      phone.style.opacity = String(clamp(phoneIntro * 1.25 - phoneOutro));
      phone.style.transform = `translate3d(0, ${String(phoneY)}px, 0) scale(${String(phoneScale)}) rotateY(${String(phoneOutro * 90)}deg)`;

      words.forEach((word, index) => {
        if (!word) return;
        const intro = clamp((progress - index * 0.018) / 0.08);
        const direction = index === 1 ? 1 : -1;
        word.style.opacity = String(clamp(intro - textExit));
        word.style.transform = `translate3d(${String(direction * textExit * 105)}vw, ${String((1 - intro) * 28)}px, 0)`;
      });

      const screenProgress = clamp((progress - 0.25) / 0.64);
      const rawScreen = screenProgress * (screens.length - 0.001);
      const nextActiveScreen = Math.min(screens.length - 1, Math.floor(rawScreen));

      screens.forEach((screen, index) => {
        if (!screen) return;
        const offset = clamp(index - rawScreen, -1, 1) * 100;
        screen.style.transform = `translate3d(${String(offset)}%, 0, 0)`;
      });

      if (nextActiveScreen !== lastActiveScreen) {
        lastActiveScreen = nextActiveScreen;
        setActiveScreen(nextActiveScreen);
      }
    };

    const scheduleRender = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(render);
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      scheduleRender();
    };

    render();
    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', scheduleRender);
    motionQuery?.addEventListener('change', handleMotionChange);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleRender);
      window.removeEventListener('resize', scheduleRender);
      motionQuery?.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const activeLabel = sideLabels[activeScreen] ?? sideLabels[0];

  return (
    <section
      id="story"
      ref={sectionRef}
      aria-label="The C1RCLE app experience"
      className="relative z-10 -mt-[10vh] h-[760vh] bg-black text-white md:h-[500vh] motion-reduce:mt-0 motion-reduce:h-auto"
    >
      <div className="sticky top-0 flex h-[100svh] min-h-[620px] flex-col items-center justify-center overflow-hidden px-4 pb-4 pt-20 md:px-8 md:py-16 motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-[760px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(244,74,34,0.22),transparent_34%),linear-gradient(180deg,#000_0%,#070707_42%,#000_100%)]" />
        <div className="nightlife-grain pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[58rem] w-[58rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />

        <div className="pointer-events-none absolute left-1/2 top-[27vh] z-0 w-full -translate-x-1/2 text-center sm:top-[24vh] md:top-[10vh]">
          <h2 className="flex flex-col items-center -space-y-[0.5vw] text-[13vw] font-black leading-[1.1] tracking-tighter sm:text-[11vw] md:text-[14vw] lg:text-[16vw]">
            <span ref={vibeRef} className="inline-block px-2 pb-2 pt-2 text-white/50 md:pb-4">
              VIBE
            </span>
            <span ref={connectRef} className="inline-block px-2 pb-2 text-[#f44a22] md:pb-4">
              CONNECT
            </span>
            <span ref={experienceRef} className="inline-block px-2 pb-2 text-white md:pb-4">
              EXPERIENCE
            </span>
          </h2>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
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

        <div className="pointer-events-none relative z-20 mt-10 mb-6 flex h-[60px] w-full flex-col items-center justify-center text-center lg:hidden">
          <StoryLabel label={activeLabel} compact />
        </div>

        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-center">
          <div className="relative flex scale-100 justify-center sm:scale-110 md:scale-100">
            <HomePhoneMockup
              phoneRef={phoneRef}
              screen1Ref={screen1Ref}
              screen2Ref={screen2Ref}
              screen3Ref={screen3Ref}
              screen4Ref={screen4Ref}
              screen5Ref={screen5Ref}
              screen6Ref={screen6Ref}
            />
          </div>
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

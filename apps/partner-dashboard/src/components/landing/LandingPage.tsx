'use client';

import { motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { MagneticButton } from '@/components/ui/MagneticButton';

const NightclubScene = dynamic(() => import('./NightclubScene').then((m) => m.NightclubScene), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0A0A0B]" />,
});

const fadeUp = {
  hidden: { opacity: 1, y: 24 },
  visible: { opacity: 1, y: 0 },
};

// eslint-disable-next-line import-x/no-default-export -- consumed via default import by src/app/page.tsx (outside the 2026-09-11 lint-fix scope); named-exporting here would force touching page.tsx.
export default function LandingPage() {
  const [sceneReady, setSceneReady] = useState(false);
  const reduceMotion = useReducedMotion();

  // The useful HTML is rendered immediately. WebGL is progressive enhancement,
  // deferred until after the browser has painted the headline and CTAs.
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    const compactViewport = window.matchMedia('(max-width: 767px)').matches;
    if (reduceMotion || connection?.saveData || compactViewport) return;

    const timer = window.setTimeout(() => {
      setSceneReady(true);
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [reduceMotion]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#0A0A0B]">
      {/* Layer 1: Three.js 3D nightclub scene */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(244,74,34,0.18),transparent_34%),linear-gradient(160deg,#12080a_0%,#0A0A0B_58%,#060607_100%)]">
        {sceneReady ? <NightclubScene /> : null}
      </div>

      {/* Layer 2: Bottom-up vignette so text reads against the scene */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,#0A0A0B_0%,rgba(10,10,11,0.75)_40%,transparent_100%)]" />

      {/* Top brand label */}
      <motion.div
        initial={{ opacity: 1, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-7 left-0 right-0 z-20 flex justify-center pointer-events-none"
      >
        <p className="text-[22px] font-black uppercase tracking-[0.55em] text-white [text-shadow:0_0_24px_rgba(255,255,255,0.3)]">
          THE C1RCLE
        </p>
      </motion.div>

      {/* Layer 3: useful HTML is available on first paint and remains usable
          even when the cinematic layer is disabled or still downloading. */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-20 px-6 text-center">
        {/* Main headline — each word bursts in with a shiny glow */}
        <h1 className="text-[clamp(36px,8vw,72px)] font-black uppercase tracking-tight leading-[1.0] text-white mb-5">
          {[
            { word: 'Command', tint: 'text-white', delay: 0 },
            { word: 'Your', tint: 'text-white', delay: 0.13 },
          ].map(({ word, tint, delay }) => (
            <motion.span
              key={word}
              initial={{ opacity: 1, y: 18, filter: 'blur(0px)' }}
              animate={{
                opacity: 1,
                y: [18, -2, 0],
                filter: 'blur(0px)',
                textShadow: [
                  '0 0 0px rgba(255,255,255,0)',
                  '0 0 40px rgba(255,255,255,0.95), 0 0 80px rgba(255,200,120,0.7), 0 0 120px rgba(244,74,34,0.5)',
                  '0 0 20px rgba(255,255,255,0.15), 0 0 40px rgba(244,74,34,0.2)',
                ],
              }}
              transition={{ duration: 0.75, delay, times: [0, 0.35, 1], ease: 'easeOut' }}
              className={`inline-block mr-[0.28em] ${tint}`}
            >
              {word}
            </motion.span>
          ))}
          <br />
          {[
            { word: 'Nightlife', tint: 'text-[#F44A22]', delay: 0.26 },
            { word: 'Empire', tint: 'text-[#F44A22]', delay: 0.39 },
          ].map(({ word, tint, delay }) => (
            <motion.span
              key={word}
              initial={{ opacity: 1, y: 18, filter: 'blur(0px)' }}
              animate={{
                opacity: 1,
                y: [18, -2, 0],
                filter: 'blur(0px)',
                textShadow: [
                  '0 0 0px rgba(244,74,34,0)',
                  '0 0 40px rgba(255,120,60,0.95), 0 0 80px rgba(244,74,34,0.8), 0 0 130px rgba(244,74,34,0.5)',
                  '0 0 20px rgba(244,74,34,0.3), 0 0 40px rgba(244,74,34,0.15)',
                ],
              }}
              transition={{ duration: 0.75, delay, times: [0, 0.35, 1], ease: 'easeOut' }}
              className={`inline-block mr-[0.28em] ${tint}`}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="text-[15px] font-bold text-white/55 mb-10 max-w-sm leading-relaxed"
        >
          The all-in-one partner platform for venues, hosts &amp; promoters.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.7, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <MagneticButton href="/login" className="group">
            <span
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-[15px] font-semibold text-white cursor-pointer select-none
                  transition-all duration-200 ease-out
                  group-hover:bg-white/20 group-hover:scale-[1.03]
                  group-active:scale-[0.97]
                  border border-white/20 bg-white/[0.08] backdrop-blur-[12px]"
            >
              Already a User
            </span>
          </MagneticButton>

          <MagneticButton href="/onboard" className="group">
            <span
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-[15px] font-semibold text-white cursor-pointer select-none
                  transition-all duration-200 ease-out
                  group-hover:brightness-110 group-hover:scale-[1.03]
                  group-active:scale-[0.97]
                  bg-[#F44A22] shadow-[0_0_40px_rgba(244,74,34,0.35),0_4px_16px_rgba(0,0,0,0.4)]"
            >
              Apply for Partner Access
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </MagneticButton>
        </motion.div>
      </div>
    </main>
  );
}

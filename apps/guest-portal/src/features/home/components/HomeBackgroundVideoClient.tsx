'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeToMotionPreference(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;

  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener('change', onChange);

  return () => {
    mediaQuery.removeEventListener('change', onChange);
  };
}

function getMotionPreference() {
  return typeof window.matchMedia !== 'function' || !window.matchMedia(reducedMotionQuery).matches;
}

function getServerMotionPreference() {
  return false;
}

export function HomeBackgroundVideoClient({
  desktopSrc,
  mobileSrc,
}: {
  desktopSrc: string;
  mobileSrc: string;
}) {
  const motionAllowed = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  );
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!motionAllowed) return;

    const timer = window.setTimeout(() => {
      setVideoReady(true);
    }, 800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [motionAllowed]);

  if (!motionAllowed || !videoReady) return null;

  return (
    <video
      data-testid="home-background-video"
      aria-hidden="true"
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      className="absolute inset-0 size-full scale-[1.02] object-cover"
    >
      <source media="(max-width: 639px)" src={mobileSrc} type="video/mp4" />
      <source src={desktopSrc} type="video/mp4" />
    </video>
  );
}

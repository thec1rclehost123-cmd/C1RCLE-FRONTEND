'use client';

import { useSyncExternalStore } from 'react';

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

export function HomeBackgroundVideoClient({ src }: { src: string }) {
  const motionAllowed = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  );

  if (!motionAllowed) return null;

  return (
    <video
      data-testid="home-background-video"
      aria-hidden="true"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      className="absolute inset-0 size-full scale-[1.02] object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

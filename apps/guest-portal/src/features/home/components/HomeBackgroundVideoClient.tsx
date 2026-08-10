'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!motionAllowed) return;

    const connection = (
      navigator as Navigator & { connection?: { readonly saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;

    let idleCallback = 0;
    let timer: ReturnType<typeof globalThis.setTimeout> | null = null;
    const scheduleVideo = () => {
      if ('requestIdleCallback' in window) {
        idleCallback = window.requestIdleCallback(
          () => {
            setVideoReady(true);
          },
          { timeout: 2500 },
        );
        return;
      }

      timer = globalThis.setTimeout(() => {
        setVideoReady(true);
      }, 1200);
    };

    if (document.readyState === 'complete') scheduleVideo();
    else window.addEventListener('load', scheduleVideo, { once: true });

    return () => {
      window.removeEventListener('load', scheduleVideo);
      if (idleCallback !== 0) window.cancelIdleCallback(idleCallback);
      if (timer !== null) globalThis.clearTimeout(timer);
    };
  }, [motionAllowed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updatePlayback = () => {
      if (document.hidden) video.pause();
      else void video.play().catch(() => undefined);
    };

    document.addEventListener('visibilitychange', updatePlayback);
    return () => {
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, [videoReady]);

  if (!motionAllowed || !videoReady) return null;

  return (
    <video
      ref={videoRef}
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

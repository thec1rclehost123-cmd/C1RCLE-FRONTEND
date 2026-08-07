'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const motionQuery = '(prefers-reduced-motion: reduce)';

function subscribeToMotionPreference(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}

function getMotionAllowed() {
  return typeof window.matchMedia !== 'function' || !window.matchMedia(motionQuery).matches;
}

function getServerMotionAllowed() {
  return false;
}

export function HomePartyVideoClient({
  desktopSrc,
  mobileSrc,
  posterSrc,
}: {
  desktopSrc: string;
  mobileSrc: string;
  posterSrc: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const motionAllowed = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionAllowed,
    getServerMotionAllowed,
  );
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !motionAllowed || shouldLoadVideo) return;

    if (typeof IntersectionObserver !== 'function') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoadVideo(true);
        observer.disconnect();
      },
      { rootMargin: '500px 0px' },
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [motionAllowed, shouldLoadVideo]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {shouldLoadVideo ? (
        <video
          data-testid="home-party-video"
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster={posterSrc}
          className="size-full object-cover"
        >
          <source media="(max-width: 639px)" src={mobileSrc} type="video/mp4" />
          <source src={desktopSrc} type="video/mp4" />
        </video>
      ) : (
        // The poster is visible immediately while the below-fold video remains network-idle.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterSrc} alt="" className="size-full object-cover" />
      )}
    </div>
  );
}

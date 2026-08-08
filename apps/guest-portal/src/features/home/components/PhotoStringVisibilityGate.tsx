'use client';

import { useEffect, useRef } from 'react';

import type { ReactNode } from 'react';

export function PhotoStringVisibilityGate({ children }: { readonly children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver !== 'function') return;

    let sectionVisible = false;
    const updateActivity = () => {
      container.dataset['active'] = String(sectionVisible && !document.hidden);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionVisible = entry?.isIntersecting ?? false;
        updateActivity();
      },
      { rootMargin: '120px 0px' },
    );

    observer.observe(container);
    document.addEventListener('visibilitychange', updateActivity);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateActivity);
    };
  }, []);

  return (
    <div ref={containerRef} className="photo-string-rows" data-active="false">
      {children}
    </div>
  );
}

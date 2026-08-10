'use client';

import { useEffect } from 'react';

export function PublicProfileMotionClient() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-profile-root]');
    if (!root) return;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-profile-reveal]'));

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => {
        target.setAttribute('data-profile-visible', 'true');
      });
      return;
    }

    root.setAttribute('data-profile-motion', 'ready');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-profile-visible', 'true');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    targets.forEach((target) => {
      observer.observe(target);
    });
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

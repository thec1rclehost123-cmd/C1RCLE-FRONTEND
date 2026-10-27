'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function StickyEventCheckoutCta({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const selector = document.getElementById('event-ticket-selector');
    if (!selector || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(selector);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <Link
        href={href}
        className={`mx-auto flex min-h-14 max-w-xl items-center justify-center rounded-full px-7 py-3 text-center text-sm font-black text-white transition-transform hover:scale-[1.015] active:scale-[0.985] motion-reduce:transition-none ${className}`}
      >
        {label}
      </Link>
    </div>
  );
}

'use client';

import { forwardRef } from 'react';

export const StickyEventCheckoutCta = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    className: string;
    onClick?: () => void;
  }
>(function StickyEventCheckoutCta({ label, className, onClick }, ref) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2">
      <button
        type="button"
        ref={ref}
        onClick={onClick}
        className={`pointer-events-auto mx-auto flex min-h-[50px] w-full max-w-[440px] items-center justify-center rounded-full px-6 py-2.5 text-center text-[13px] font-bold text-white shadow-[0_0_26px_rgba(255,90,61,0.24)] transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb19f] motion-reduce:transition-none sm:min-h-14 ${className}`}
      >
        {label}
      </button>
    </div>
  );
});

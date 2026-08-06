'use client';

import Link from 'next/link';
import React from 'react';

export interface LoginHeaderNavProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

export const LoginHeaderNav: React.FC<LoginHeaderNavProps> = ({
  onBack,
  showBackButton = false,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-10">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white font-black text-xs border border-white/20 shadow-md">
          <span className="text-[10px] tracking-tighter leading-none text-center">
            THE<br />C1RCLE
          </span>
        </div>
        <span className="text-sm font-black tracking-widest text-black md:text-white uppercase">
          THE C1RCLE
        </span>
      </div>

      {/* Pill Navigation (Center) */}
      <nav className="hidden lg:flex items-center gap-1 rounded-full bg-white/10 p-1.5 backdrop-blur-xl border border-white/20 shadow-lg">
        <Link
          href="/explore"
          className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          EXPLORE
        </Link>
        <Link
          href="/hosts"
          className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          HOSTS
        </Link>
        <Link
          href="/tickets"
          className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          TICKETS
        </Link>
        <Link
          href="/app"
          className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          APP
        </Link>

        {showBackButton && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors ml-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
        )}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-white px-5 py-2 text-[11px] font-black uppercase tracking-widest text-black shadow-md">
          LOGIN
        </span>
        <button
          type="button"
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

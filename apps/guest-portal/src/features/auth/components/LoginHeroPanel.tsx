'use client';

import React from 'react';

export interface LoginHeroPanelProps {
  headline?: string[];
  tagline?: string;
}

export const LoginHeroPanel: React.FC<LoginHeroPanelProps> = ({
  headline = ['GET IN', 'THE', 'C1RCLE'],
  tagline = 'DISCOVER LIFE OFFLINE',
}) => {
  return (
    <div className="relative flex w-full flex-col items-center justify-center bg-[#FF4400] px-8 pb-16 pt-28 md:min-h-screen md:w-1/2 md:p-16 lg:w-3/5">
      {/* Main Bold Typography */}
      <div className="relative z-10 w-full text-center">
        <h1 className="text-[14vw] font-black uppercase tracking-tighter leading-[0.8] text-black md:text-[10vw] lg:text-[9vw]">
          {headline[0]} <br />
          {headline[1]} <br />
          {headline[2]}
        </h1>
      </div>

      {/* Bottom Tagline */}
      <div className="mt-12 md:absolute md:bottom-12 flex items-center gap-4 opacity-80">
        <div className="h-px w-12 bg-black" />
        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-black whitespace-nowrap">
          {tagline}
        </span>
        <div className="h-px w-12 bg-black" />
      </div>
    </div>
  );
};

import React from 'react';

import { LoginHeroPanel } from './LoginHeroPanel';

export const authInputClass =
  'w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-base text-white placeholder:text-white/30 focus:border-[#FF4400] focus:outline-none';

export const authButtonClass =
  'inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#FF4400] px-6 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50';

export function AuthShell({
  eyebrow,
  title,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-black text-white selection:bg-[#FF4400]/30 selection:text-white">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <LoginHeroPanel />
        <section className="relative flex flex-1 items-center justify-center bg-black px-6 py-24 md:px-12 md:py-16">
          <div className="w-full max-w-md">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4400]">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">{title}</h1>
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

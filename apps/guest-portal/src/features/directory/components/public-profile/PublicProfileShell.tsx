import Link from 'next/link';

import { PublicProfileMotionClient } from './PublicProfileMotionClient';

import type { PublicProfileTheme } from '../../types/directory.types';
import type { CSSProperties, ReactNode } from 'react';

/* eslint-disable no-restricted-syntax -- editable profile themes require scoped CSS variables */

type ProfileStyle = CSSProperties & {
  '--profile-accent': string;
  '--profile-accent-soft': string;
  '--profile-accent-text': string;
};

export function PublicProfileShell({
  backHref,
  backLabel,
  children,
  theme,
}: {
  backHref: string;
  backLabel: string;
  children: ReactNode;
  theme: PublicProfileTheme;
}) {
  const style: ProfileStyle = {
    '--profile-accent': theme.accent,
    '--profile-accent-soft': theme.accentSoft,
    '--profile-accent-text': theme.accentText,
  };

  return (
    <div
      data-profile-root
      style={style}
      className="public-profile-page relative z-10 min-h-screen overflow-x-clip bg-[#030303] pb-28 pt-24 text-white sm:pt-28"
    >
      <PublicProfileMotionClient />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black">
        <div className="absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(circle_at_50%_-12%,var(--profile-accent-soft),transparent_62%)]" />
        <div className="nightlife-grain absolute inset-0 opacity-[0.16]" />
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/55 backdrop-blur-xl transition-colors hover:border-white/25 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </Link>
        {children}
      </div>
    </div>
  );
}

// FIXTURE_ONLY: Floating navigation shell matching reference screenshot spacing.

import Image from 'next/image';
import Link from 'next/link';

import { DesktopNavLinks } from './DesktopNavLinks';
import { NavbarActions } from './NavbarActions';

export function Navbar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6">
      <nav
        aria-label="Primary navigation"
        className="flex w-full max-w-5xl items-center justify-between gap-4 sm:gap-8"
      >
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="pointer-events-auto group flex items-center gap-3 shrink-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#FF4400]/40 bg-black shadow-md transition-transform duration-500 group-hover:rotate-180 motion-reduce:transition-none sm:h-11 sm:w-11">
            <Image
              src="/c1rcle-logo.webp"
              alt=""
              fill
              sizes="44px"
              className="object-cover"
              preload
            />
          </div>
          <span className="font-heading text-lg sm:text-xl font-black tracking-tighter uppercase text-white group-hover:text-white/90 transition-colors">
            THE C1RCLE
          </span>
        </Link>

        {/* Center: Dedicated Glassmorphism Navigation Pill */}
        <div className="pointer-events-auto">
          <DesktopNavLinks />
        </div>

        <NavbarActions />
      </nav>
    </header>
  );
}

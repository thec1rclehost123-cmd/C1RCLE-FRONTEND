'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DesktopNavLinks } from './DesktopNavLinks';
import { NavbarActions } from './NavbarActions';

export function Navbar() {
  const isHome = usePathname() === '/';

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-8 lg:px-12">
      <nav
        aria-label="Primary navigation"
        className={`w-full items-center gap-4 sm:gap-8 ${
          isHome
            ? 'mx-auto grid max-w-[1000px] grid-cols-[1fr_auto_1fr]'
            : 'mx-auto flex max-w-[1600px] justify-between'
        }`}
      >
        <Link
          href="/"
          className={`pointer-events-auto group flex shrink-0 items-center gap-3 ${isHome ? 'justify-self-start lg:mr-8 lg:justify-self-end' : ''}`}
        >
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
          <span className="font-heading text-lg font-black uppercase tracking-tighter text-white transition-colors group-hover:text-white/90 sm:text-xl">
            THE C1RCLE
          </span>
        </Link>

        <div
          className={`pointer-events-auto ${isHome ? 'justify-self-center' : 'ml-auto flex items-center gap-3'}`}
        >
          <DesktopNavLinks />
        </div>

        <div
          className={
            isHome ? 'justify-self-end lg:ml-8 lg:justify-self-start' : 'pointer-events-auto'
          }
        >
          <NavbarActions isHome={isHome} />
        </div>
      </nav>
    </header>
  );
}

'use client';

// FIXTURE_ONLY: Temporary UI development navbar.

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { useSession } from '@c1rcle/auth';
import { useTheme } from '@c1rcle/providers';

import { DesktopNavLinks, navLinks } from './DesktopNavLinks';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { isAuthenticated } = useSession();
  const { setTheme, theme } = useTheme();
  const accountHref = isAuthenticated ? '/profile' : '/login';
  const accountLabel = isAuthenticated ? 'PROFILE' : 'LOGIN';

  useEffect(() => {
    let frame = 0;
    const updateScrollState = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 32);
      });
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScrollState);
    };
  }, []);

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 transition-[padding] duration-500 motion-reduce:transition-none sm:px-5 ${
        scrolled ? 'pt-2.5' : 'pt-3 sm:pt-4'
      }`}
    >
      <nav
        className={`pointer-events-auto mx-auto grid w-full grid-cols-[minmax(0,1fr)_auto] items-center px-3 py-2 transition-[max-width,border-color,background-color,border-radius,box-shadow,backdrop-filter] duration-500 motion-reduce:transition-none sm:px-4 lg:grid-cols-[minmax(190px,1fr)_minmax(460px,500px)_minmax(190px,1fr)] lg:gap-4 ${
          scrolled
            ? 'max-w-[1240px] rounded-full border border-white/[0.15] bg-black/72 shadow-[0_14px_55px_rgba(0,0,0,0.48)] backdrop-blur-2xl'
            : 'max-w-[1240px] rounded-none border border-transparent bg-transparent shadow-none backdrop-blur-none'
        }`}
      >
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 sm:gap-3.5 lg:justify-self-start"
        >
          <span className="relative size-11 shrink-0 overflow-hidden rounded-full border border-[#FF5A2B]/40 bg-black shadow-[0_0_24px_rgba(255,68,0,0.14)] sm:size-12">
            <Image src="/c1rcle-logo.webp" alt="" fill sizes="48px" className="object-cover" />
          </span>
          <span className="hidden text-[16px] font-black uppercase tracking-[-0.045em] text-white transition-colors group-hover:text-[#FF6842] min-[390px]:inline sm:text-lg">
            THE C1RCLE
          </span>
        </Link>

        {/* Desktop Links */}
        <DesktopNavLinks />

        {/* Right Controls */}
        <div className="flex items-center justify-self-end gap-2 lg:justify-self-stretch lg:pl-8 xl:pl-12">
          {!isLoginPage && (
            <Link
              href={accountHref}
              className="hidden min-h-11 items-center justify-center rounded-full bg-white px-8 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_5px_22px_rgba(255,255,255,0.13)] transition-transform hover:scale-[1.03] lg:inline-flex motion-reduce:transition-none"
            >
              {accountLabel}
            </Link>
          )}

          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => {
              setTheme(theme === 'light' ? 'dark' : 'light');
            }}
            className="hidden size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white hover:text-black lg:flex"
          >
            {theme === 'light' ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4 fill-none stroke-current stroke-[2]"
              >
                <circle cx="12" cy="12" r="3.5" />
                <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                <path d="M20.2 15.1A8.2 8.2 0 0 1 8.9 3.8 8.3 8.3 0 1 0 20.2 15Z" />
              </svg>
            )}
          </button>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => {
              setMobileMenuOpen((prev) => !prev);
            }}
            className="flex size-9 flex-col items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl lg:hidden"
          >
            <span
              className={`h-0.5 w-5 bg-white transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-[5px]' : ''}`}
            />
            <span
              className={`h-0.5 w-5 bg-white transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`h-0.5 w-5 bg-white transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl lg:hidden flex flex-col justify-center items-center pointer-events-auto p-8">
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
                aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
                className={`text-3xl font-black uppercase transition-colors tracking-tight ${
                  pathname.startsWith(link.href)
                    ? 'text-[#FF4400]'
                    : 'text-white hover:text-[#FF4400]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="w-full h-px bg-white/10 my-4" />

            <Link
              href={accountHref}
              onClick={() => {
                setMobileMenuOpen(false);
              }}
              className="w-full py-4 text-center rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest"
            >
              {isAuthenticated ? 'PROFILE' : 'LOGIN / SIGN UP'}
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
              }}
              className="mt-6 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

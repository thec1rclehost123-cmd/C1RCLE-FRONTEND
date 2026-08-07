'use client';

// FIXTURE_ONLY: Temporary UI development navbar.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { DesktopNavLinks, navLinks } from './DesktopNavLinks';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center pt-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between px-4 py-2.5 sm:px-6 border border-white/10 rounded-full max-w-5xl mx-auto w-[92%] bg-black/60 backdrop-blur-2xl shadow-lg">
        {/* Brand Logo & Name */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#FF4400]/40 bg-black text-white transition-all duration-500 group-hover:rotate-180 group-hover:border-[#FF4400]">
            <span className="text-[9px] font-black tracking-tighter leading-none text-center">
              THE
              <br />
              C1RCLE
            </span>
          </div>
          <span className="text-sm font-black tracking-widest uppercase text-white group-hover:text-[#FF4400] transition-colors">
            THE C1RCLE
          </span>
        </Link>

        {/* Desktop Links */}
        <DesktopNavLinks />

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {!isLoginPage && (
            <Link
              href="/login"
              className="hidden lg:inline-flex items-center justify-center px-6 py-2 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/90 hover:scale-105 transition-all shadow-md"
            >
              LOGIN
            </Link>
          )}

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => {
              setMobileMenuOpen((prev) => !prev);
            }}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full bg-white/10 border border-white/20 lg:hidden text-white"
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
              href="/login"
              onClick={() => {
                setMobileMenuOpen(false);
              }}
              className="w-full py-4 text-center rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest"
            >
              LOGIN / SIGN UP
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

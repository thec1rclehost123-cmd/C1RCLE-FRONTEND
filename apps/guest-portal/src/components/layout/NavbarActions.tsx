'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useSession } from '@c1rcle/auth';
import { AccountIcon, SearchIcon } from '@c1rcle/icons';

import { navLinks } from './DesktopNavLinks';

export function NavbarActions({
  isAuthenticated: isAuthenticatedProp,
  isHome = false,
}: {
  isAuthenticated?: boolean;
  isHome?: boolean;
}) {
  const { isAuthenticated: isSessionAuthenticated } = useSession();
  const isAuthenticated = isAuthenticatedProp ?? isSessionAuthenticated;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isSearchPage = pathname.startsWith('/search');
  const accountHref = isAuthenticated ? '/profile' : '/login';
  const accountLabel = isAuthenticated ? 'PROFILE' : 'LOGIN';

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    focusable?.[0]?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || focusable === undefined || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('keydown', trapFocus);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('keydown', trapFocus);
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <div className="pointer-events-auto flex shrink-0 items-center gap-2 sm:gap-3">
      {!isLoginPage && isHome && (
        <Link
          href={accountHref}
          className="hidden items-center justify-center rounded-full bg-white px-7 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-md transition-[transform,background-color] duration-200 hover:scale-[1.03] hover:bg-white/90 motion-reduce:transition-none lg:inline-flex"
        >
          {accountLabel}
        </Link>
      )}

      {!isHome && !isLoginPage && (
        <>
          <Link
            href="/search"
            aria-label="Search events"
            aria-current={isSearchPage ? 'page' : undefined}
            className={`hidden size-10 items-center justify-center rounded-full border transition-[color,border-color,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none lg:inline-flex ${isSearchPage ? 'border-white bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.2)]' : 'border-white/15 bg-black/45 text-white/75 hover:border-[#FF6842]/55 hover:bg-white/[0.06] hover:text-[#FF6842]'}`}
          >
            <SearchIcon aria-hidden="true" size={19} strokeWidth={1.8} />
          </Link>
          <Link
            href={accountHref}
            aria-label={accountLabel === 'PROFILE' ? 'Profile' : 'Login'}
            className="hidden size-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/75 transition-[color,border-color,background-color] duration-200 hover:border-[#FF6842]/55 hover:bg-white/[0.06] hover:text-[#FF6842] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none lg:inline-flex"
          >
            <AccountIcon aria-hidden="true" size={19} strokeWidth={1.8} />
          </Link>
        </>
      )}

      <button
        ref={menuButtonRef}
        type="button"
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-navigation"
        onClick={() => {
          setMobileMenuOpen((open) => !open);
        }}
        className="flex size-10 flex-col items-center justify-center gap-1.5 rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-xl lg:hidden"
      >
        <span
          className={`h-0.5 w-5 bg-white transition-transform duration-200 motion-reduce:transition-none ${mobileMenuOpen ? 'translate-y-[5px] rotate-45' : ''}`}
        />
        <span
          className={`h-0.5 w-5 bg-white transition-opacity duration-200 motion-reduce:transition-none ${mobileMenuOpen ? 'opacity-0' : ''}`}
        />
        <span
          className={`h-0.5 w-5 bg-white transition-transform duration-200 motion-reduce:transition-none ${mobileMenuOpen ? '-translate-y-[5px] -rotate-45' : ''}`}
        />
      </button>

      {mobileMenuOpen && (
        <div
          ref={menuRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="pointer-events-auto fixed inset-0 z-[-1] flex items-center justify-center bg-black/96 p-8 pt-24 backdrop-blur-xl lg:hidden"
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-6">
            {navLinks.map((link) => {
              const active =
                pathname.startsWith(link.href) ||
                (link.href === '/hosts' && pathname.startsWith('/venue/'));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full rounded-full px-6 py-4 text-center text-3xl font-black uppercase tracking-tight transition-[color,background-color,box-shadow] duration-200 motion-reduce:transition-none ${active ? 'bg-[#FF6842] text-white shadow-[0_8px_22px_rgba(255,104,66,0.28)]' : 'text-white/75 hover:bg-white/[0.08] hover:text-white'}`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="my-4 h-px w-full bg-white/10" />

            <Link
              href={accountHref}
              onClick={closeMenu}
              className="w-full rounded-2xl bg-white py-4 text-center text-xs font-black uppercase tracking-widest text-black"
            >
              {accountLabel === 'PROFILE' ? accountLabel : 'LOGIN / SIGN UP'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

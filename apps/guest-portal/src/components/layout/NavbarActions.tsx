'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { navLinks } from './DesktopNavLinks';

export function NavbarActions({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const accountHref = isAuthenticated ? '/profile' : '/login';
  const accountLabel = isAuthenticated ? 'PROFILE' : 'LOGIN';

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="pointer-events-auto flex shrink-0 items-center gap-3">
      {!isLoginPage && (
        <Link
          href={accountHref}
          className="hidden items-center justify-center rounded-full bg-white px-7 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-md transition-[transform,background-color] duration-200 hover:scale-[1.03] hover:bg-white/90 motion-reduce:transition-none lg:inline-flex"
        >
          {accountLabel}
        </Link>
      )}

      <button
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
          id="mobile-navigation"
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
                  className={`text-3xl font-black uppercase tracking-tight transition-colors duration-200 motion-reduce:transition-none ${active ? 'text-[#FF6842]' : 'text-white hover:text-[#FF6842]'}`}
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

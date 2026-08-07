'use client';

// FIXTURE_ONLY: Temporary UI development navigation links.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export interface NavLinkItem {
  label: string;
  href: string;
}

export const navLinks: NavLinkItem[] = [
  { label: 'Explore', href: '/explore' },
  { label: 'Hosts', href: '/hosts' },
  { label: 'Tickets', href: '/tickets' },
  { label: 'App', href: '/app' },
];

export function DesktopNavLinks() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div
      className={`relative hidden w-full items-center justify-center gap-1 rounded-full border p-1.5 backdrop-blur-2xl transition-colors duration-500 lg:flex ${
        isLoginPage ? 'border-white/10 bg-black/35' : 'border-white/10 bg-white/[0.055]'
      }`}
    >
      {navLinks.map((link) => {
        const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative min-w-[108px] flex-1 rounded-full px-5 py-3 text-center text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
              isActive
                ? 'bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.24)]'
                : 'text-white/62 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <span>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

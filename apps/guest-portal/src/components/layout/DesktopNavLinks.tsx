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
      className={`relative hidden items-center gap-1 lg:flex rounded-full p-1 border backdrop-blur-md transition-all duration-500 ${
        isLoginPage
          ? 'bg-black/40 border-white/10 backdrop-blur-xl shadow-sm'
          : 'bg-white/5 border-white/10'
      }`}
    >
      {navLinks.map((link) => {
        const isActive =
          link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              isActive
                ? 'bg-[#FF4400] text-white shadow-md shadow-[#FF4400]/20'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

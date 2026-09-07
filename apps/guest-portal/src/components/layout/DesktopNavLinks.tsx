'use client';

// FIXTURE_ONLY: Dedicated glassmorphism container pill for navigation links.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
    <div className="relative hidden grid-cols-4 items-center rounded-full border border-white/15 bg-black/65 p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:grid">
      {navLinks.map((link) => {
        const isActive =
          link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href) ||
              (link.label === 'Hosts' && pathname.startsWith('/venue/'));

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`relative min-w-[112px] rounded-full px-6 py-2.5 text-center text-xs font-black uppercase tracking-widest transition-[color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none ${
              isActive
                ? 'z-10 bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.22)]'
                : 'font-bold text-white/70 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

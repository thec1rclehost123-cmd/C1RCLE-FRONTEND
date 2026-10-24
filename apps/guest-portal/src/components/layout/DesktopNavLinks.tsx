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
    <div className="relative hidden grid-cols-4 items-center rounded-full border border-white/15 bg-black/65 p-1.5 shadow-[0_14px_38px_rgba(0,0,0,0.65)] backdrop-blur-xl lg:grid">
      {navLinks.map((link) => {
        const isActive =
          (link.href === '/explore' &&
            (pathname.startsWith('/explore') ||
              pathname.startsWith('/search') ||
              pathname.startsWith('/event/'))) ||
          (link.href !== '/explore' && pathname.startsWith(link.href)) ||
          (link.label === 'Hosts' &&
            (pathname.startsWith('/host/') || pathname.startsWith('/venue/')));

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`relative min-w-[102px] rounded-full px-5 py-2.5 text-center text-[12px] font-bold uppercase tracking-[0.12em] transition-[color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none ${
              isActive
                ? 'z-10 bg-[#FF6842] text-white shadow-[0_8px_22px_rgba(255,104,66,0.28)]'
                : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

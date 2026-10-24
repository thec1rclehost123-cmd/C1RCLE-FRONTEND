'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useSession } from '@c1rcle/auth';
import { AccountIcon, HomeIcon, TicketIcon, UsersIcon } from '@c1rcle/icons';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useSession();

  if (/^\/(checkout|confirmation|event|login|signup|forgot-password|reset-password)(\/|$)/.test(pathname)) {
    return null;
  }

  const links = [
    { label: 'Explore', href: '/explore', icon: HomeIcon, active: pathname === '/' || pathname.startsWith('/explore') || pathname.startsWith('/search') },
    { label: 'Hosts', href: '/hosts', icon: UsersIcon, active: pathname.startsWith('/hosts') || pathname.startsWith('/host/') || pathname.startsWith('/venue/') },
    { label: 'Tickets', href: '/tickets', icon: TicketIcon, active: pathname.startsWith('/tickets') },
    { label: 'Profile', href: isAuthenticated ? '/profile' : '/login', icon: AccountIcon, active: pathname.startsWith('/profile') },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-bottom-nav fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex w-[min(calc(100%-2rem),22rem)] items-center justify-around rounded-full border border-white/15 bg-[#11100f]/88 p-1.5 shadow-[0_16px_52px_rgba(0,0,0,0.8)] backdrop-blur-xl lg:hidden"
    >
      {links.map(({ label, href, icon: Icon, active }) => (
        <Link
          key={label}
          href={href}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          className={`flex size-12 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${active ? 'bg-white text-black shadow-[0_2px_16px_rgba(255,255,255,0.24)]' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
        >
          <Icon aria-hidden="true" size={21} strokeWidth={active ? 2.3 : 1.8} />
        </Link>
      ))}
    </nav>
  );
}

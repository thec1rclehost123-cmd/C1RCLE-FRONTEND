'use client';

// FIXTURE_ONLY: Temporary UI development mobile bottom navigation.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide mobile bottom nav on authentication pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/auth') {
    return null;
  }

  const navItems = [
    { label: 'Explore', href: '/explore' },
    { label: 'Tickets', href: '/tickets' },
    { label: 'App', href: '/app' },
    { label: 'Login', href: '/login' },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="rounded-full border border-white/10 bg-black/80 backdrop-blur-2xl px-6 py-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]">
        <ul className="flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    isActive ? 'text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-1 w-4 rounded-full bg-[#FF4400]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

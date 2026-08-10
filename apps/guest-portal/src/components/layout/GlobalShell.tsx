'use client';

// FIXTURE_ONLY: Temporary UI development global shell wrapper.

import { usePathname } from 'next/navigation';
import React from 'react';

import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { RitualBackground } from './RitualBackground';

export interface GlobalShellProps {
  children: React.ReactNode;
}

export function GlobalShell({ children }: GlobalShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className="relative min-h-screen w-full bg-black text-white selection:bg-[#FF4400]/30 selection:text-white flex flex-col justify-between">
      {/* Background canvas */}
      <RitualBackground />

      {/* Global Navbar */}
      <Navbar />

      {/* Main Content Viewport */}
      <main id="main" tabIndex={-1} className="flex-1 w-full relative">
        {children}
      </main>

      {/* Global Footer (hidden on login page for full-height split view) */}
      {!isLoginPage && <Footer />}
    </div>
  );
}

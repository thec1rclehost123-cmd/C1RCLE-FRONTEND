import { Footer } from './layout/Footer';
import { Navbar } from './layout/Navbar';
import { RitualBackground } from './layout/RitualBackground';
import { RouteFooter } from './layout/RouteFooter';

import type { ReactNode } from 'react';


export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between bg-black text-white selection:bg-[#FF4400]/30 selection:text-white">
      <RitualBackground />
      <Navbar />
      <main id="main" tabIndex={-1} className="relative w-full flex-1">
        {children}
      </main>
      <RouteFooter>
        <Footer />
      </RouteFooter>
    </div>
  );
}

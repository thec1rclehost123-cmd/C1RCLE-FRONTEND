import Link from 'next/link';
import React from 'react';

import { TicketCarousel } from './TicketCarousel';

import type { TicketShowcaseItem } from '../types/tickets.types';

export interface TicketsGuestViewProps {
  headline: string;
  tagline: string;
  items: TicketShowcaseItem[];
}

export function TicketsGuestView({ headline, tagline, items }: TicketsGuestViewProps) {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-20 sm:px-8 flex-1 flex flex-col justify-center">
      {/* Page Title */}
      <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-10 select-none">
        TICKETS
      </h1>

      {/* Responsive Split View */}
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
        {/* Left Copy & CTA Panel */}
        <div className="flex flex-col items-start max-w-lg">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6 leading-[0.9]">
            {headline}
          </h2>

          <p className="text-sm font-medium text-white/60 leading-relaxed mb-8">{tagline}</p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-white/90 hover:scale-105 transition-all text-center shadow-lg shadow-white/10"
            >
              LOGIN TO ACCESS
            </Link>
            <Link
              href="/login?mode=register"
              className="px-8 py-3.5 rounded-full border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all text-center"
            >
              SIGN UP
            </Link>
          </div>
        </div>

        {/* Right 3D Ticket Carousel */}
        <div className="w-full flex items-center justify-center">
          <TicketCarousel items={items} />
        </div>
      </div>
    </div>
  );
}

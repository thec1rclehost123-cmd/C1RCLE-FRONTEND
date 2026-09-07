'use client';

// FIXTURE_ONLY: Temporary UI development ticket carousel component.

import React, { useState } from 'react';

import type { TicketShowcaseItem } from '../types/tickets.types';

export interface TicketCarouselProps {
  items: TicketShowcaseItem[];
}

export function TicketCarousel({ items }: TicketCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(2); // VIP as default center card

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1 < items.length ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : items.length - 1));
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] flex flex-col items-center justify-center">
      {/* Subtle Ambient Radial Orange Glow Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,68,0,0.48)_0%,rgba(255,68,0,0.22)_45%,transparent_75%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4400]/35 blur-2xl"
      />

      {/* 3D Stack Viewport */}
      <div className="relative h-[400px] w-full flex justify-center items-center">
        {items.map((ticket, index) => {
          const offset = index - activeIndex;
          const isActive = index === activeIndex;

          // Compute 3D stacked transform positioning via Tailwind classes
          let transformClasses = 'translate-x-0 scale-100 z-30 opacity-100 rotate-0';
          if (offset === -2) {
            transformClasses = '-translate-x-[240px] scale-80 z-10 opacity-40 -rotate-12';
          } else if (offset === -1) {
            transformClasses = '-translate-x-[120px] scale-90 z-20 opacity-80 -rotate-6';
          } else if (offset === 1) {
            transformClasses = 'translate-x-[120px] scale-90 z-20 opacity-80 rotate-6';
          } else if (offset === 2) {
            transformClasses = 'translate-x-[240px] scale-80 z-10 opacity-40 rotate-12';
          } else if (Math.abs(offset) > 2) {
            transformClasses = 'scale-50 opacity-0 pointer-events-none';
          }

          return (
            <button
              type="button"
              key={ticket.id}
              onClick={() => {
                setActiveIndex(index);
              }}
              aria-label={`Select ${ticket.title} ticket tier`}
              className={`absolute w-[250px] sm:w-[270px] h-[380px] sm:h-[410px] rounded-[32px] cursor-pointer flex flex-col justify-between p-6 overflow-hidden transition-all duration-500 border backdrop-blur-xl text-left ${transformClasses} ${
                isActive
                  ? 'border-[#FF4400]/40 bg-gradient-to-br from-[#1a1a1a] via-[#111111] to-[#0a0a0a] shadow-[0_0_50px_rgba(255,68,0,0.35),0_25px_60px_-15px_rgba(0,0,0,0.9)]'
                  : 'border-white/10 bg-zinc-950/90 shadow-2xl hover:border-white/20'
              }`}
            >
              {/* Active Ticket Card Orange Glow Ring */}
              {isActive && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-1 rounded-[32px] border border-[#FF4400]/50 shadow-[0_0_30px_rgba(255,68,0,0.3)]"
                />
              )}

              {/* Card Header Tag */}
              <div className="relative flex justify-between items-start z-10 w-full">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isActive
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className={`text-xs font-black ${isActive ? 'text-[#FF4400]' : 'text-white/40'}`}>
                    ★
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black tracking-[0.2em] text-white/40">
                    THE C1RCLE
                  </span>
                  <div className="h-0.5 w-6 bg-white/20 mt-1" />
                </div>
              </div>

              {/* Vertical Title Bar */}
              <div className="relative text-center my-auto transform -rotate-90 translate-y-2 z-10 w-full">
                <h3
                  className={`font-black uppercase tracking-tighter whitespace-nowrap transition-all duration-300 ${
                    ticket.title.length > 6 ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-6xl'
                  } ${isActive ? 'text-white' : 'text-white/30'}`}
                >
                  {ticket.title}
                </h3>
              </div>

              {/* Card Footer Details */}
              <div className="relative w-full z-10">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">
                      PRICE
                    </p>
                    <p className="text-base sm:text-lg font-black text-white">{ticket.price}</p>
                  </div>
                  <div className="h-7 w-10 rounded bg-white/10 flex items-center justify-center gap-0.5">
                    <div className="w-1 h-3 bg-white/30" />
                    <div className="w-0.5 h-2 bg-white/30" />
                    <div className="w-1 h-3 bg-white/30" />
                  </div>
                </div>

                <div
                  className={`w-full py-2.5 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isActive ? 'SELECT TICKET' : 'VIEW'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Arrow Controls */}
      <div className="flex gap-5 mt-6 z-40">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous ticket"
          className="w-11 h-11 rounded-full border border-white/15 bg-white/5 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-95 shadow-md"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next ticket"
          className="w-11 h-11 rounded-full border border-white/15 bg-white/5 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-95 shadow-md"
        >
          ›
        </button>
      </div>
    </div>
  );
}

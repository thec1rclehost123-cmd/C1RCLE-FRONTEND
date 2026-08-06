'use client';

import Link from 'next/link';
import { useState } from 'react';

import { getEventAccentClasses, getGuestToneClass } from '../eventDetailPalette';

import type { EventAccentTone, EventDetailGuest } from '../types/event-detail.types';

export function GuestlistPreviewClient({
  accentTone,
  guests,
  interestedCount,
}: {
  accentTone: EventAccentTone;
  guests: readonly EventDetailGuest[];
  interestedCount: number;
}) {
  const [open, setOpen] = useState(false);
  const accent = getEventAccentClasses(accentTone);

  return (
    <>
      <section
        aria-label="Guest list preview"
        className={`rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl sm:p-6 ${accent.border} ${accent.eventGlow}`}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
            {guests[0]?.name ?? 'Guests'} and {interestedCount - 1} others going
          </h2>
          <button
            type="button"
            aria-label="View all guests"
            onClick={() => {
              setOpen(true);
            }}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            ⛶
          </button>
        </div>
        <div className="mt-6 flex gap-4 overflow-x-auto border-b border-white/10 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5">
          {guests.map((guest) => (
            <GuestAvatar guest={guest} key={guest.id} size="large" />
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guestlist-dialog-heading"
            className={`relative w-full max-w-xl rounded-[2rem] border bg-[#0d090b] p-6 shadow-2xl sm:p-8 ${accent.borderStrong}`}
          >
            <button
              type="button"
              aria-label="Close guest list preview"
              onClick={() => {
                setOpen(false);
              }}
              className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full border border-white/10 text-2xl text-white/55 hover:text-white"
            >
              ×
            </button>

            <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${accent.text}`}>
              THE C1RCLE APP
            </p>
            <h2
              id="guestlist-dialog-heading"
              className="mt-6 max-w-md text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl"
            >
              Get the app to view the guestlist and more
            </h2>

            <div className="mt-8 flex -space-x-3">
              {guests.slice(0, 5).map((guest) => (
                <GuestAvatar guest={guest} key={guest.id} size="modal" />
              ))}
            </div>

            <Link
              href="/app"
              className="mt-8 flex min-h-14 w-full items-center justify-center rounded-full bg-white px-6 text-center text-sm font-black text-black sm:mx-auto sm:max-w-sm"
            >
              Get THE C1RCLE app
            </Link>

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-7 text-center">
              {[
                ['Ticket', 'Instant ticket access'],
                ['Transfer', 'Easy ticket transfers'],
                ['Discover', 'Curated for you'],
              ].map(([label, detail]) => (
                <div key={label}>
                  <p className="text-xl text-white/75" aria-hidden="true">
                    {label === 'Ticket' ? '▣' : label === 'Transfer' ? '⇄' : '◎'}
                  </p>
                  <p className="mt-3 text-[10px] leading-4 text-white/45 sm:text-xs">{detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function GuestAvatar({ guest, size }: { guest: EventDetailGuest; size: 'large' | 'modal' }) {
  return (
    <span
      title={guest.name}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-black font-black text-black ${
        size === 'large' ? 'size-16 text-sm sm:size-[4.5rem]' : 'size-16 text-sm sm:size-20'
      } ${getGuestToneClass(guest.tone)}`}
    >
      {guest.initials}
    </span>
  );
}

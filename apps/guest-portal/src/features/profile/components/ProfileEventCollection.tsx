'use client';

import { useState } from 'react';

import { ProfileEventCard } from './ProfileEventCard';

import type { ProfileEventSummary } from '../types/profile.types';

const PAGE_SIZE = 10;

export function ProfileEventCollection({
  events,
  label,
}: {
  events: readonly ProfileEventSummary[];
  label: string;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(events.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visibleEvents = events.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  if (events.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {visibleEvents.map((event) => (
          <ProfileEventCard key={event.id} event={event} posterOnly />
        ))}
      </div>
      {pageCount > 1 ? (
        <nav
          aria-label={`${label} pagination`}
          className="mt-6 flex items-center justify-center gap-4 text-xs text-white/55"
        >
          <button
            type="button"
            onClick={() => {
              setPage(currentPage - 1);
            }}
            disabled={currentPage === 0}
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-lg text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Previous ${label.toLowerCase()} page`}
          >
            ←
          </button>
          <span aria-live="polite" className="min-w-24 text-center">
            {currentPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => {
              setPage(currentPage + 1);
            }}
            disabled={currentPage + 1 >= pageCount}
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-lg text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Next ${label.toLowerCase()} page`}
          >
            →
          </button>
        </nav>
      ) : null}
    </>
  );
}

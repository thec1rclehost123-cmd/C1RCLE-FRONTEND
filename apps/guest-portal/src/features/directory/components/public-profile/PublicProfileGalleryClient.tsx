'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import type { PublicProfileMedia } from '../../types/directory.types';

export function PublicProfileGalleryClient({ items }: { items: readonly PublicProfileMedia[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeItem = activeIndex === null ? null : items[activeIndex];

  useEffect(() => {
    if (!activeItem) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowRight') {
        setActiveIndex((index) => (index === null ? 0 : (index + 1) % items.length));
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((index) => (index === null ? 0 : (index - 1 + items.length) % items.length));
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeItem, items.length]);

  if (items.length === 0) return null;

  return (
    <>
      <div
        data-profile-reveal
        className="grid auto-rows-[13rem] grid-cols-2 gap-3 sm:auto-rows-[18rem] lg:grid-cols-4"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveIndex(index);
            }}
            aria-label={`Open image: ${item.alt}`}
            className={`group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] text-left ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes={
                index === 0 ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1024px) 50vw, 25vw'
              }
              className="object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
            {item.caption && (
              <span className="absolute inset-x-0 bottom-0 p-4 text-xs font-semibold text-white/75 sm:p-5">
                {item.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Profile gallery"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl sm:p-8"
        >
          <button
            type="button"
            onClick={() => {
              setActiveIndex(null);
            }}
            className="absolute right-5 top-5 z-10 flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/55 text-xl text-white"
            aria-label="Close gallery"
          >
            ×
          </button>
          <div className="relative h-[82dvh] w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#080808]">
            <Image
              src={activeItem.src}
              alt={activeItem.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
            {activeItem.caption && (
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-6 pb-6 pt-16 text-center text-sm text-white/75">
                {activeItem.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

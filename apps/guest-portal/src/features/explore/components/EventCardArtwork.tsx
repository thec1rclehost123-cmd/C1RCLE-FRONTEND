'use client';

import Image from 'next/image';
import { useState } from 'react';

import { EventArtworkFallback } from './EventArtworkFallback';

export function EventCardArtwork({
  src,
  title,
  startsAt,
  category,
}: {
  src: string;
  title: string;
  startsAt: string;
  category: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (src === '/c1rcle-logo.webp' || failedSource === src) {
    return <EventArtworkFallback startsAt={startsAt} category={category} />;
  }
  return (
    <Image
      src={src}
      alt={`${title} event poster`}
      fill
      unoptimized
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      onError={() => {
        setFailedSource(src);
      }}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transition-none"
    />
  );
}

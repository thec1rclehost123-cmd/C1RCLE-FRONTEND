'use client';

import Image from 'next/image';
import { useState } from 'react';

import { shouldBypassEventImageOptimizer } from '@/lib/events/image-optimization';

export function OverviewEventPoster({
  src,
  alt = '',
  className,
  fallbackClassName,
  sizes,
}: {
  readonly src?: string | undefined;
  readonly alt?: string;
  readonly className: string;
  readonly fallbackClassName: string;
  readonly sizes: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const available = Boolean(src) && failedSrc !== src;

  return (
    <>
      <div className={fallbackClassName} aria-hidden="true" />
      {available ? (
        <Image
          src={src ?? ''}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
          // Browser-local previews and public GCS posters must bypass the
          // Next optimizer, which cannot fetch blob URLs or every staging bucket.
          unoptimized={shouldBypassEventImageOptimizer(src ?? '')}
          onError={() => {
            setFailedSrc(src ?? null);
          }}
        />
      ) : null}
    </>
  );
}

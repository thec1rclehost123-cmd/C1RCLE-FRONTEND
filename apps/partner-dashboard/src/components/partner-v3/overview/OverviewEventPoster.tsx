'use client';

import Image from 'next/image';
import { useState } from 'react';

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
          // Local fixture URLs point back to this dashboard and must bypass
          // the remote image optimizer; production remote hosts stay allowlisted.
          unoptimized={/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(src ?? '')}
          onError={() => {
            setFailedSrc(src ?? null);
          }}
        />
      ) : null}
    </>
  );
}

'use client';

import Image from 'next/image';
import { useState } from 'react';

import { shouldBypassEventImageOptimizer } from '@/lib/events/image-optimization';

import styles from './events.module.css';

import type { PartnerEventArtwork } from '@/data/partner-data-source';

const gradientClasses: Readonly<Record<string, string>> = {
  eclipse: styles['posterGradientEclipse'] ?? '',
  mystery: styles['posterGradientMystery'] ?? '',
  nova: styles['posterGradientNova'] ?? '',
  placeholder: styles['posterGradientPlaceholder'] ?? '',
  sunset: styles['posterGradientSunset'] ?? '',
  warehouse: styles['posterGradientWarehouse'] ?? '',
  bollywood: styles['posterGradientBollywood'] ?? '',
  monsoon: styles['posterGradientMonsoon'] ?? '',
};

export function EventPoster({
  artwork,
  className,
  sizes,
}: {
  readonly artwork: PartnerEventArtwork;
  readonly className?: string | undefined;
  readonly sizes?: string | undefined;
}) {
  const [unavailableImage, setUnavailableImage] = useState<string | null>(null);
  const showImage = artwork.type === 'image' && unavailableImage !== artwork.value;
  const gradient =
    artwork.type === 'gradient'
      ? (gradientClasses[artwork.value] ?? styles['posterGradientDefault'])
      : styles['posterGradientDefault'];

  return (
    <div className={[styles['eventPoster'], className].filter(Boolean).join(' ')}>
      <div
        data-testid="event-poster-fallback"
        className={[styles['eventPosterGradient'], gradient].join(' ')}
        aria-hidden="true"
      />
      {showImage ? (
        <Image
          src={artwork.value}
          alt={artwork.alt ?? ''}
          fill
          loading="eager"
          sizes={sizes ?? '240px'}
          onError={() => {
            setUnavailableImage(artwork.value);
          }}
          unoptimized={shouldBypassEventImageOptimizer(artwork.value)}
        />
      ) : null}
    </div>
  );
}

'use client';

import Image from 'next/image';
import { useState } from 'react';

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
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = artwork.type === 'image' ? normalizeImageSrc(artwork.value) : null;
  const isLocalImage = artwork.type === 'image' && isLocalImageSrc(artwork.value);

  return (
    <div className={[styles['eventPoster'], className].filter(Boolean).join(' ')}>
      {imageSrc && !imageFailed ? (
        <Image
          src={imageSrc}
          alt={artwork.alt ?? ''}
          fill
          loading="eager"
          sizes={sizes ?? '240px'}
          unoptimized={isLocalImage}
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <div
          className={[
            styles['eventPosterGradient'],
            gradientClasses[artwork.value] ?? styles['posterGradientDefault'],
          ].join(' ')}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function isLocalImageSrc(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (url.port === '3001' || url.port === '')
    );
  } catch {
    return false;
  }
}

function normalizeImageSrc(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (url.port === '3001' || url.port === '')
    ) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }
  return value;
}

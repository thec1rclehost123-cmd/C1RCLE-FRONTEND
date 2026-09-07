import Image from 'next/image';

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

export function EventPoster({ artwork, className, sizes }: { readonly artwork: PartnerEventArtwork; readonly className?: string | undefined; readonly sizes?: string | undefined }) {
  return (
    <div className={[styles['eventPoster'], className].filter(Boolean).join(' ')}>
      {artwork.type === 'image' ? (
        <Image src={artwork.value} alt={artwork.alt ?? ''} fill loading="eager" sizes={sizes ?? '240px'} />
      ) : (
        <div className={[styles['eventPosterGradient'], gradientClasses[artwork.value] ?? styles['posterGradientDefault']].join(' ')} aria-hidden="true" />
      )}
    </div>
  );
}

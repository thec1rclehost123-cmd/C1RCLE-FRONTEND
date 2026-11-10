import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import styles from './partners.module.css';

import type { PartnerRelationship } from '@/data/partner-data-source';

export function PartnerCard({
  partner,
  href,
}: {
  readonly partner: PartnerRelationship;
  readonly href: string;
  readonly onActionUnavailable?: (() => void) | undefined;
  readonly hostAccent?: boolean;
  readonly connecting?: boolean;
  readonly connectError?: string | null | undefined;
  readonly onConnect?: ((partner: PartnerRelationship) => void) | undefined;
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const avatarSrc = partner.avatarUrl && !avatarFailed ? partner.avatarUrl : null;
  return (
    <article className={styles['partnerCard']}>
      <div className={styles['partnerCardCover']}>
        {partner.coverUrl && !coverFailed ? (
          <Image
            src={partner.coverUrl}
            alt=""
            fill
            sizes="320px"
            unoptimized
            onError={() => { setCoverFailed(true); }}
          />
        ) : null}
      </div>
      <div className={styles['partnerCardArtwork']}>
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={`${partner.name} profile`}
            fill
            sizes="320px"
            unoptimized
            onError={() => {
              setAvatarFailed(true);
            }}
          />
        ) : (
          <span className={styles['partnerInitials']} aria-hidden="true">
            {partner.initials}
          </span>
        )}
      </div>
      <div className={styles['partnerCardBody']}>
        <div className={styles['partnerCardIdentity']}>
          <h3>{partner.name}</h3>
          <p>
            {[partner.role, partner.location === '—' ? '' : partner.location]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {partner.stats.length ? (
            <ul className={styles['partnerCardStats']} aria-label={`${partner.name} summary`}>
              {partner.stats.slice(0, 2).map((stat) => (
                <li key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></li>
              ))}
            </ul>
          ) : null}
        </div>
        <Link className={styles['profileLink']} href={href}>
          View profile <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}

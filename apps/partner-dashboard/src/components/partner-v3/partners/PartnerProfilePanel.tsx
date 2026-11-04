import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/partner-v3/Button';

import styles from './partners.module.css';
import { PartnerStatusBadge } from './PartnerStatusBadge';

import type { PartnerRelationship } from '@/data/partner-data-source';

export function PartnerProfilePanel({
  partner,
  closeHref,
  primaryButtonClassName,
  hostAccent = false,
  connecting = false,
  connectError = null,
  onConnect,
}: {
  readonly partner: PartnerRelationship;
  readonly closeHref: string;
  readonly primaryButtonClassName?: string;
  readonly hostAccent?: boolean;
  readonly connecting?: boolean;
  readonly connectError?: string | null;
  readonly onConnect?: ((partner: PartnerRelationship) => void) | undefined;
}) {
  const actionLabel =
    partner.status === 'Partnered'
      ? partner.kind === 'promoter'
        ? 'Assign to event'
        : 'Request a date'
      : 'Connect';
  const isDiscover = !partner.status;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarSrc =
    partner.avatarUrl && !avatarFailed ? partner.avatarUrl : '/partner-v3/staff-avatar.png';
  const profileMeta = [
    ...new Set(
      [partnerLabel(partner.kind), partner.role, partner.location]
        .filter((value) => value && value !== '—')
        .map((value) => value.trim()),
    ),
  ];
  return (
    <aside className={styles['profilePanel']} aria-label={`${partner.name} profile`}>
      <div className={styles['profilePanelHeader']}>
        <span className={styles['sectionKicker']}>Partner profile</span>
        <Link className={styles['profileClose']} href={closeHref} aria-label="Close profile">
          ×
        </Link>
      </div>
      <div className={styles['profileIdentity']}>
        <span className={styles['profileAvatar']}>
          <Image
            src={avatarSrc}
            alt={`${partner.name} profile`}
            fill
            sizes="64px"
            unoptimized
            onError={() => {
              setAvatarFailed(true);
            }}
          />
        </span>
        <div>
          <div className={styles['profileNameRow']}>
            <h2>{partner.name}</h2>
            {partner.verified ? (
              <span className={styles['verified']} aria-label="Verified partner">
                ✓
              </span>
            ) : null}
          </div>
          <p>{profileMeta.join(' · ')}</p>
        </div>
        {partner.status ? (
          <PartnerStatusBadge status={partner.status} hostAccent={hostAccent} />
        ) : null}
      </div>
      {partner.stats.length ? (
        <section className={styles['profileStats']} aria-label="Partner activity">
          {partner.stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>
      ) : null}
      {partner.genres.length || partner.upcomingEvents.length ? (
        <div className={styles['profileDetails']}>
          {partner.genres.length ? (
            <div>
              <span>Genres</span>
              <strong>{partner.genres.join(' · ')}</strong>
            </div>
          ) : null}
          {partner.upcomingEvents.length ? (
            <div>
              <span>Upcoming events</span>
              <div className={styles['upcomingEvents']}>
                {partner.upcomingEvents.map((event) => (
                  <span key={event.id}>
                    <strong>{event.name}</strong>
                    <small>{event.dateLabel}</small>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {connectError ? (
        <p role="alert" className={styles['requestError'] ?? ''}>
          {connectError}
        </p>
      ) : null}
      {isDiscover ? (
        <Button
          type="button"
          variant="primary"
          className={primaryButtonClassName}
          disabled={connecting || !onConnect}
          onClick={() => onConnect?.(partner)}
        >
          {connecting ? 'Connecting…' : 'Connect'}
        </Button>
      ) : (
        <Button
          type="button"
          variant="primary"
          className={primaryButtonClassName}
          disabled
          title={
            partner.status === 'Partnered'
              ? 'Event assignment is not available yet.'
              : 'Choose one of your venues to send a connection request.'
          }
        >
          {actionLabel}
        </Button>
      )}
    </aside>
  );
}

function partnerLabel(kind: PartnerRelationship['kind']): string {
  switch (kind) {
    case 'venue':
      return 'Venue';
    case 'host':
      return 'Host';
    case 'promoter':
      return 'Promoter';
  }
}

import Link from 'next/link';

import { Avatar } from '@/components/partner-v3/Avatar';
import { Button } from '@/components/partner-v3/Button';

import styles from './partners.module.css';
import { PartnerStatusBadge } from './PartnerStatusBadge';

import type { PartnerRelationship } from '@/data/partner-data-source';

export function PartnerProfilePanel({ partner, closeHref, primaryButtonClassName, hostAccent = false, connecting = false, connectError = null, onConnect }: {
  readonly partner: PartnerRelationship;
  readonly closeHref: string;
  readonly primaryButtonClassName?: string;
  readonly hostAccent?: boolean;
  readonly connecting?: boolean;
  readonly connectError?: string | null;
  readonly onConnect?: ((partner: PartnerRelationship) => void) | undefined;
}) {
  const isDiscover = !partner.status;
  const actionLabel = partner.status === 'Partnered' ? (partner.kind === 'promoter' ? 'Assign to event' : 'Request a date') : 'Invite to partner';
  return (
    <aside className={styles['profilePanel']} aria-label={`${partner.name} profile`}>
      <div className={styles['profilePanelHeader']}>
        <span className={styles['sectionKicker']}>Partner profile</span>
        <Link className={styles['profileClose']} href={closeHref} aria-label="Close profile">×</Link>
      </div>
      <div className={styles['profileIdentity']}>
        <Avatar name={partner.name} />
        <div>
          <div className={styles['profileNameRow']}>
            <h2>{partner.name}</h2>
            {partner.verified ? <span className={styles['verified']} aria-label="Verified partner">✓</span> : null}
          </div>
          <p>{partner.kind === 'host' ? 'Host' : partner.kind === 'venue' ? 'Venue' : 'Promoter'} · {partner.location}</p>
        </div>
            {partner.status ? <PartnerStatusBadge status={partner.status} hostAccent={hostAccent} /> : null}
      </div>
      <div className={styles['profileStats']}>
        {partner.stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
      </div>
      <div className={styles['profileDetails']}>
        <div><span>Genres</span><strong>{partner.genres.join(' · ')}</strong></div>
        <div><span>Upcoming events</span><div className={styles['upcomingEvents']}>{partner.upcomingEvents.map((event) => <span key={event.id}><strong>{event.name}</strong><small>{event.dateLabel}</small></span>)}</div></div>
      </div>
      {connectError ? (
        <p role="alert" className={styles['requestError'] ?? ''}>
          {connectError}
        </p>
      ) : null}
      {isDiscover && onConnect ? (
        <Button
          type="button"
          variant="primary"
          className={primaryButtonClassName}
          disabled={connecting}
          title={`Send a connection request to ${partner.name}`}
          onClick={() => onConnect(partner)}
        >
          {connecting ? 'Connecting…' : actionLabel}
        </Button>
      ) : (
        <Button type="button" variant="primary" className={primaryButtonClassName} disabled title="Partner actions are not available yet">{actionLabel}</Button>
      )}
    </aside>
  );
}

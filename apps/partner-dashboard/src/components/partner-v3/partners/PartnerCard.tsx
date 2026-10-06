import Link from 'next/link';

import { Avatar } from '@/components/partner-v3/Avatar';
import { Button } from '@/components/partner-v3/Button';

import styles from './partners.module.css';
import { PartnerStatusBadge } from './PartnerStatusBadge';

import type { PartnerRelationship, PartnerRelationshipStatus } from '@/data/partner-data-source';

const actionForStatus = (
  status: PartnerRelationshipStatus | undefined,
  kind: PartnerRelationship['kind'],
) => {
  if (status === 'Partnered') return kind === 'promoter' ? 'Assign to event' : 'Request a date';
  if (!status) return 'Connect';
  return 'Send reminder';
};

export function PartnerCard({
  partner,
  href,
  onActionUnavailable,
  hostAccent = false,
  connecting = false,
  connectError = null,
  onConnect,
}: {
  readonly partner: PartnerRelationship;
  readonly href: string;
  readonly onActionUnavailable?: () => void;
  readonly hostAccent?: boolean;
  readonly connecting?: boolean;
  readonly connectError?: string | null;
  readonly onConnect?: ((partner: PartnerRelationship) => void) | undefined;
}) {
  const actionLabel = actionForStatus(partner.status, partner.kind);
  const isDiscover = !partner.status;
  const cardToneClass = `partnerCard${partner.cardTone.slice(0, 1).toUpperCase()}${partner.cardTone.slice(1)}`;
  return (
    <article className={`${styles['partnerCard']} ${styles[cardToneClass]}`}>
      <div className={styles['partnerCardArtwork']} aria-hidden="true">
        <span>{partner.initials}</span>
      </div>
      <div className={styles['partnerCardBody']}>
        <div className={styles['partnerCardTopline']}>
          {partner.status ? (
            <PartnerStatusBadge status={partner.status} hostAccent={hostAccent} />
          ) : null}
        </div>
        <div className={styles['partnerIdentity']}>
          <Avatar name={partner.name} />
          <div>
            <h3>{partner.name}</h3>
            <p>
              {partner.role}
              {partner.genres.length ? ` \u00b7 ${partner.genres.join(', ')}` : ''}
            </p>
          </div>
        </div>
        {connectError ? (
          <p role="alert" className={styles['requestError'] ?? ''}>
            {connectError}
          </p>
        ) : null}
        <div className={styles['partnerCardActions']}>
          {isDiscover ? (
            <Button
              type="button"
              variant="secondary"
              disabled={connecting || !onConnect}
              title={onConnect ? `Send a connection request to ${partner.name}` : 'Connect'}
              onClick={() => onConnect?.(partner)}
            >
              {connecting ? 'Connecting\u2026' : 'Connect'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={!partner.status || partner.status !== 'Partnered'}
              title={
                partner.status === 'Partnered'
                  ? 'Event assignment is not available yet.'
                  : 'Choose one of your venues to send a connection request.'
              }
              onClick={onActionUnavailable}
            >
              {actionLabel}
            </Button>
          )}
          <Link className={styles['profileLink']} href={href}>
            View profile <span aria-hidden="true">\u2197</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
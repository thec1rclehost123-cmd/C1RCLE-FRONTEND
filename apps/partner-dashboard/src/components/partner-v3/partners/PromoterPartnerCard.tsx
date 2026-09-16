import { Badge } from '@/components/partner-v3/Badge';
import { Button } from '@/components/partner-v3/Button';

import styles from './partners.module.css';

import type { PromoterPartnerRecord } from '@/data/partner-data-source';

export function PromoterPartnerCard({
  partner,
  connecting = false,
  connectError = null,
  onConnect,
}: {
  readonly partner: PromoterPartnerRecord;
  readonly connecting?: boolean;
  readonly connectError?: string | null;
  readonly onConnect?: ((partner: PromoterPartnerRecord) => void) | undefined;
}) {
  const isDiscover = partner.state === 'discover';
  return (
    <article className={styles['promoterPartnerCard']}>
      <div className={[styles['promoterPartnerCover'], styles[`partnerCard${partner.cardTone[0]?.toUpperCase() ?? ''}${partner.cardTone.slice(1)}`]].join(' ')}>
        <Badge className={styles['promoterKindBadge'] ?? ''}>{partner.kind.toUpperCase()}</Badge>
        <span className={styles['promoterInitial']} aria-hidden="true">{partner.initials}</span>
      </div>
      <div className={styles['promoterPartnerBody']}>
        <h2>{partner.name}</h2>
        <p>{partner.role}</p>
        {connectError ? (
          <p role="alert" className={styles['requestError'] ?? ''}>
            {connectError}
          </p>
        ) : null}
        {isDiscover ? (
          <Button
            type="button"
            variant="secondary"
            disabled={connecting || !onConnect}
            title={onConnect ? `Send a connection request to ${partner.name}` : partner.actionLabel}
            onClick={() => onConnect?.(partner)}
          >
            {connecting ? 'Connecting…' : partner.actionLabel}
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled title="Connected">
            {partner.actionLabel}
          </Button>
        )}
      </div>
    </article>
  );
}

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
  if (!status) return 'Invite to partner';
  return 'Send reminder';
};

export function PartnerCard({
  partner,
  href,
  onActionUnavailable,
  hostAccent = false,
}: {
  readonly partner: PartnerRelationship;
  readonly href: string;
  readonly onActionUnavailable?: () => void;
  readonly hostAccent?: boolean;
}) {
  const actionLabel = actionForStatus(partner.status, partner.kind);
  return (
    <article
      className={[
        styles['partnerCard'],
        styles[
          `partnerCard${partner.cardTone.slice(0, 1).toUpperCase()}${partner.cardTone.slice(1)}`
        ],
      ].join(' ')}
    >
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
              {partner.genres.length ? ` · ${partner.genres.join(', ')}` : ''}
            </p>
          </div>
        </div>
        <div className={styles['partnerCardActions']}>
          <Button
            type="button"
            variant="secondary"
            disabled={!partner.status || partner.status !== 'Partnered'}
            title={
              partner.status === 'Partnered'
                ? 'This action is unavailable in fixture mode'
                : 'This relationship action is unavailable in fixture mode'
            }
            onClick={onActionUnavailable}
          >
            {actionLabel}
          </Button>
          <Link className={styles['profileLink']} href={href}>
            View profile <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

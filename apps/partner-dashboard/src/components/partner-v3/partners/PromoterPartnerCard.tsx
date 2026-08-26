import { Badge } from '@/components/partner-v3/Badge';
import { Button } from '@/components/partner-v3/Button';

import styles from './partners.module.css';

import type { PromoterPartnerRecord } from '@/data/partner-data-source';

export function PromoterPartnerCard({ partner }: { readonly partner: PromoterPartnerRecord }) {
  return (
    <article className={styles['promoterPartnerCard']}>
      <div className={[styles['promoterPartnerCover'], styles[`partnerCard${partner.cardTone[0]?.toUpperCase() ?? ''}${partner.cardTone.slice(1)}`]].join(' ')}>
        <Badge className={styles['promoterKindBadge'] ?? ''}>{partner.kind.toUpperCase()}</Badge>
        <span className={styles['promoterInitial']} aria-hidden="true">{partner.initials}</span>
      </div>
      <div className={styles['promoterPartnerBody']}>
        <h2>{partner.name}</h2>
        <p>{partner.role}</p>
        <Button type="button" variant="secondary" disabled title="Partner relationship changes are unavailable in fixture mode">{partner.actionLabel}</Button>
      </div>
    </article>
  );
}

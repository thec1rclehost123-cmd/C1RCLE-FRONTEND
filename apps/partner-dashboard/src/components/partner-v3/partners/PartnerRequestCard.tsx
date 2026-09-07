import { Avatar } from '@/components/partner-v3/Avatar';
import { Button } from '@/components/partner-v3/Button';

import styles from './partners.module.css';
import { PartnerStatusBadge } from './PartnerStatusBadge';

import type { PartnerRequest } from '@/data/partner-data-source';

export function PartnerRequestCard({ request, hostAccent = false }: { readonly request: PartnerRequest; readonly hostAccent?: boolean }) {
  return (
    <article className={styles['requestCard']}>
      <div className={styles['partnerIdentity']}>
        <Avatar name={request.name} />
        <div>
          <div className={styles['requestNameRow']}>
            <h3>{request.name}</h3>
            <PartnerStatusBadge status={request.direction === 'incoming' ? 'Waiting on them' : 'Invite sent'} hostAccent={hostAccent} />
          </div>
          <p>{request.note}</p>
        </div>
      </div>
      <div className={styles['requestActions']}>
        {request.direction === 'incoming' ? (
          <>
            <Button type="button" variant="ghost" disabled title="Request actions are unavailable in fixture mode">Decline</Button>
            <Button type="button" variant="primary" disabled title="Request actions are unavailable in fixture mode">Accept</Button>
          </>
        ) : (
          <Button type="button" variant="secondary" disabled title="Request actions are unavailable in fixture mode">Send reminder</Button>
        )}
      </div>
    </article>
  );
}

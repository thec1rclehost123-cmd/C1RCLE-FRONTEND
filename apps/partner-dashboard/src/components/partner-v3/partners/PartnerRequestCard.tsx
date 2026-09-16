import { Avatar } from '@/components/partner-v3/Avatar';
import { Button } from '@/components/partner-v3/Button';

import styles from './partners.module.css';
import { PartnerStatusBadge } from './PartnerStatusBadge';

import type { PartnerRequest } from '@/data/partner-data-source';

export function PartnerRequestCard({
  request,
  hostAccent = false,
  pendingAction = null,
  error = null,
  onApprove,
  onReject,
}: {
  readonly request: PartnerRequest;
  readonly hostAccent?: boolean;
  readonly pendingAction?: 'approve' | 'reject' | null;
  readonly error?: string | null;
  readonly onApprove?: ((request: PartnerRequest) => void) | undefined;
  readonly onReject?: ((request: PartnerRequest) => void) | undefined;
}) {
  const busy = pendingAction !== null;
  return (
    <article className={styles['requestCard']}>
      <div className={styles['partnerIdentity']}>
        <Avatar name={request.name} />
        <div>
          <div className={styles['requestNameRow']}>
            <h3>{request.name}</h3>
            <PartnerStatusBadge status={request.direction === 'incoming' ? 'Action needed' : 'Invite sent'} hostAccent={hostAccent} />
          </div>
          <p>{request.note}</p>
          {error ? (
            <p role="alert" className={styles['requestError'] ?? ''}>
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <div className={styles['requestActions']}>
        {request.direction === 'incoming' ? (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || !onReject}
              title={onReject ? 'Decline this request' : 'Decline'}
              onClick={() => onReject?.(request)}
            >
              {pendingAction === 'reject' ? 'Declining…' : 'Decline'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={busy || !onApprove}
              title={onApprove ? 'Accept this request' : 'Accept'}
              onClick={() => onApprove?.(request)}
            >
              {pendingAction === 'approve' ? 'Accepting…' : 'Accept'}
            </Button>
          </>
        ) : (
          <span className={styles['requestOutgoingNote'] ?? ''}>Awaiting their response</span>
        )}
      </div>
    </article>
  );
}

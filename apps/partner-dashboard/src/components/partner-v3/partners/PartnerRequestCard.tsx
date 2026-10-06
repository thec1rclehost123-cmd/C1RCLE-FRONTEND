'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar } from '@/components/partner-v3/Avatar';
import { Button } from '@/components/partner-v3/Button';
import { getActiveOrgId } from '@/lib/org/active-org';
import { resolvePartnership } from '@/lib/partner/api-partnerships-repository';
import { resolvePromoterConnection } from '@/lib/partner/promoter-connection-repository';

import styles from './partners.module.css';
import { PartnerStatusBadge } from './PartnerStatusBadge';

import type { PartnerRequest } from '@/data/partner-data-source';

export function PartnerRequestCard({
  request,
  hostAccent = false,
  organizationId,
  pendingRequestId,
  pendingRequestAction,
  requestErrorId,
  requestError,
  onApproveRequest,
  onRejectRequest,
}: {
  readonly request: PartnerRequest;
  readonly hostAccent?: boolean;
  /** Server-resolved org. Falls back to the active-org cookie when absent. */
  readonly organizationId?: string | undefined;
  readonly pendingRequestId?: string | null | undefined;
  readonly pendingRequestAction?: 'approve' | 'reject' | null | undefined;
  readonly requestErrorId?: string | null | undefined;
  readonly requestError?: string | null | undefined;
  readonly onApproveRequest?: ((request: PartnerRequest) => void) | undefined;
  readonly onRejectRequest?: ((request: PartnerRequest) => void) | undefined;
}) {
  const router = useRouter();
  const [internalPendingAction, setInternalPendingAction] = useState<'approve' | 'reject' | null>(
    null,
  );
  const [internalError, setInternalError] = useState<string | null>(null);

  // Rows read from the backend carry their mutation target; rows without one
  // (fixtures, legacy callers) keep their actions disabled.
  const live = request.target ?? null;

  const isPending =
    (pendingRequestId === request.id && pendingRequestAction != null) ||
    internalPendingAction !== null;
  const currentAction =
    pendingRequestId === request.id && pendingRequestAction != null
      ? pendingRequestAction
      : internalPendingAction;

  const answer = async (decision: 'approve' | 'reject'): Promise<void> => {
    const resolvedOrgId = organizationId ?? getActiveOrgId();
    if (live === null || resolvedOrgId === null) return;
    setInternalPendingAction(decision);
    setInternalError(null);
    try {
      if (live.graph === 'partnership') {
        await resolvePartnership(
          resolvedOrgId,
          live.id,
          decision === 'approve' ? 'approve' : 'reject',
          undefined,
        );
      } else {
        await resolvePromoterConnection(
          resolvedOrgId,
          live.id,
          decision === 'approve' ? 'approve' : 'reject',
          undefined,
        );
      }
      router.refresh();
    } catch {
      setInternalError('Could not update the request. Check your connection and try again.');
    } finally {
      setInternalPendingAction(null);
    }
  };

  const handleApprove = () => {
    if (onApproveRequest) {
      onApproveRequest(request);
      return;
    }
    void answer('approve');
  };

  const handleReject = () => {
    if (onRejectRequest) {
      onRejectRequest(request);
      return;
    }
    void answer('reject');
  };

  const displayError =
    requestErrorId === request.id && requestError != null ? requestError : internalError;

  return (
    <article className={styles['requestCard']}>
      <div className={styles['partnerIdentity']}>
        <Avatar name={request.name} />
        <div>
          <div className={styles['requestNameRow']}>
            <h3>{request.name}</h3>
            <PartnerStatusBadge
              status={request.direction === 'incoming' ? 'Waiting on them' : 'Invite sent'}
              hostAccent={hostAccent}
            />
          </div>
          <p>{request.note}</p>
        </div>
      </div>
      {displayError ? <p role="alert">{displayError}</p> : null}
      <div className={styles['requestActions']}>
        {request.direction === 'incoming' ? (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={live === null || isPending}
              title={live === null ? 'Request actions are unavailable in fixture mode' : 'Decline'}
              onClick={handleReject}
            >
              {isPending && currentAction === 'reject' ? 'Declining…' : 'Decline'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={live === null || isPending}
              title={live === null ? 'Request actions are unavailable in fixture mode' : 'Accept'}
              onClick={handleApprove}
            >
              {isPending && currentAction === 'approve' ? 'Accepting…' : 'Accept'}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="secondary"
            disabled
            title="Reminders are not available yet"
          >
            Send reminder
          </Button>
        )}
      </div>
    </article>
  );
}

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
}: {
  readonly request: PartnerRequest;
  readonly hostAccent?: boolean;
  /** Server-resolved org. Falls back to the active-org cookie when absent. */
  readonly organizationId?: string;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Rows read from the backend carry their mutation target; rows without one
  // (fixtures, legacy callers) keep their actions disabled.
  const live = request.target ?? null;

  const answer = async (decision: 'approve' | 'reject'): Promise<void> => {
    const resolvedOrgId = organizationId ?? getActiveOrgId();
    if (live === null || resolvedOrgId === null) return;
    setPendingAction(decision);
    setError(null);
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
      setError('Could not update the request. Check your connection and try again.');
    } finally {
      setPendingAction(null);
    }
  };

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
      {error ? <p role="alert">{error}</p> : null}
      <div className={styles['requestActions']}>
        {request.direction === 'incoming' ? (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={live === null || pendingAction !== null}
              title={live === null ? 'Request actions are unavailable in fixture mode' : 'Decline'}
              onClick={() => {
                void answer('reject');
              }}
            >
              {pendingAction === 'reject' ? 'Declining…' : 'Decline'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={live === null || pendingAction !== null}
              title={live === null ? 'Request actions are unavailable in fixture mode' : 'Accept'}
              onClick={() => {
                void answer('approve');
              }}
            >
              {pendingAction === 'approve' ? 'Accepting…' : 'Accept'}
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

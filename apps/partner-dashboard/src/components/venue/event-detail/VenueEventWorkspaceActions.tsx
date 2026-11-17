'use client';

import Link from 'next/link';

import { DoorModeIcon } from '@c1rcle/icons';

import styles from '@/components/partner-v3/event-detail/event-workspace.module.css';
import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

export function VenueEventWorkspaceActions({ eventId }: { readonly eventId: string }) {
  const auth = useDashboardAuth();
  if (!auth.canDo('canManageDoorMode')) return null;

  return (
    <div className={styles['actions']} aria-label="Venue event actions">
      <Link
        className={styles['primaryAction']}
        href={`/partner/venue/events/${encodeURIComponent(eventId)}/door`}
      >
        <DoorModeIcon size={14} aria-hidden="true" /> Door Mode
      </Link>
    </div>
  );
}

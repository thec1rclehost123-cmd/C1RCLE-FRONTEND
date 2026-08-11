'use client';

import Link from 'next/link';

import { DoorModeIcon, EditIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import styles from './EventDetailLayout.module.css';

export function EventDetailActions({
  eventId,
  eventName,
}: {
  readonly eventId: string;
  readonly eventName: string;
}) {
  const auth = useDashboardAuth();
  const canEdit = auth.canDo('canEditEvent');
  const canOpenDoorMode = auth.canDo('canManageDoorMode');

  if (!canEdit && !canOpenDoorMode) return null;

  return (
    <div className={styles['eventActions']} aria-label={`Actions for ${eventName}`}>
      {canEdit ? (
        <Link href={`/venue/events/${eventId}/edit`}>
          <EditIcon size={18} aria-hidden="true" />
          Edit event
        </Link>
      ) : null}
      {canOpenDoorMode ? (
        <Link className={styles['primaryAction']} href={`/venue/door?eventId=${eventId}`}>
          <DoorModeIcon size={19} aria-hidden="true" />
          Open door mode
        </Link>
      ) : null}
    </div>
  );
}

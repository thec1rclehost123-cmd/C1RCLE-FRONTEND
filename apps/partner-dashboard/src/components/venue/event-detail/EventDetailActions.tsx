'use client';

import { DoorModeIcon, EditIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { useVenueStudio } from '../store';

import styles from './EventDetailLayout.module.css';

export function EventDetailActions({ eventName }: { readonly eventName: string }) {
  const auth = useDashboardAuth();
  const venue = useVenueStudio();
  const canEdit = auth.canDo('canEditEvent');
  const canOpenDoorMode = auth.canDo('canManageDoorMode');

  if (!canEdit && !canOpenDoorMode) return null;

  return (
    <div className={styles['eventActions']} aria-label={`Actions for ${eventName}`}>
      {canEdit ? (
        <button type="button" onClick={venue.openEdit}>
          <EditIcon size={18} aria-hidden="true" />
          Edit event
        </button>
      ) : null}
      {canOpenDoorMode ? (
        <button
          className={styles['primaryAction']}
          type="button"
          onClick={() => {
            venue.go('door');
          }}
        >
          <DoorModeIcon size={19} aria-hidden="true" />
          Open door mode
        </button>
      ) : null}
    </div>
  );
}

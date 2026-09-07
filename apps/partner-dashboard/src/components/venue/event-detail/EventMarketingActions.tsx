'use client';

import { useState } from 'react';

import { CopyIcon, EditIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { useVenueStudio } from '../store';

import styles from './VenueEventOperations.module.css';

const canUseMarketing = (permissions: readonly string[]): boolean =>
  permissions.length === 0 || permissions.includes('*') || permissions.includes('VIEW_MARKETING');

export function CreateEventMessageAction({ label }: { readonly label: 'Create message' | 'Edit' }) {
  const auth = useDashboardAuth();
  const venue = useVenueStudio();
  if (!canUseMarketing(auth.grantedPermissions)) return null;

  return (
    <button
      className={label === 'Create message' ? styles['primaryButton'] : styles['secondaryButton']}
      type="button"
      onClick={() => {
        venue.go('marketing');
      }}
    >
      {label === 'Edit' ? <EditIcon size={17} aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

export function CopyEventLinkAction({ eventUrl }: { readonly eventUrl: string }) {
  const [status, setStatus] = useState('Copy link');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setStatus('Copied');
      window.setTimeout(() => {
        setStatus('Copy link');
      }, 1800);
    } catch {
      setStatus('Copy unavailable');
    }
  };

  return (
    <>
      <button className={styles['copyEventLink']} type="button" onClick={() => void copy()}>
        <CopyIcon size={17} aria-hidden="true" />
        {status}
      </button>
      <span className={styles['srOnly']} aria-live="polite">
        {status === 'Copied' ? 'Event link copied' : ''}
      </span>
    </>
  );
}

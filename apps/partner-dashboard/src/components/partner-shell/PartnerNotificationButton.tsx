'use client';

import { NotificationIcon } from '@c1rcle/icons';

import type { RefObject } from 'react';

export function PartnerNotificationButton({
  buttonRef,
  open,
  onClick,
}: {
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly open: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="partner-notification-button"
      aria-label="Notifications"
      aria-expanded={open}
      onClick={onClick}
    >
      <NotificationIcon size={20} strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}

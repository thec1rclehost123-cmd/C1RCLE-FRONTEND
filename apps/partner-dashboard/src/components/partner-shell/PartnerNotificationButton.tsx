'use client';

import { NotificationIcon } from '@c1rcle/icons';

import type { RefObject } from 'react';

export function PartnerNotificationButton({
  buttonRef,
  open,
  unreadCount = 0,
  onClick,
}: {
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly open: boolean;
  readonly unreadCount?: number;
  readonly onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="partner-notification-button"
      aria-label={
        unreadCount > 0 ? `Notifications (${String(unreadCount)} unread)` : 'Notifications'
      }
      aria-expanded={open}
      onClick={onClick}
    >
      <NotificationIcon size={20} strokeWidth={1.7} aria-hidden="true" />
      {unreadCount > 0 ? (
        <span aria-hidden="true">{unreadCount > 9 ? '9+' : String(unreadCount)}</span>
      ) : null}
    </button>
  );
}

'use client';

import Link from 'next/link';
import { useRef } from 'react';

import { CalendarIcon, CloseIcon, ForwardIcon } from '@c1rcle/icons';

import { useOverlayFocus } from '@/components/venue/useOverlayFocus';
import { venueNotifications } from '@/components/venue/venue-notifications-model';

export function VenueNotificationDrawer({
  open,
  onClose,
  trigger,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly trigger: React.RefObject<HTMLButtonElement | null>;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  useOverlayFocus({ open, containerRef: drawerRef, restoreFocusRef: trigger, onClose });
  if (!open) return null;
  const compact = venueNotifications.slice(0, 3);
  return (
    <aside
      ref={drawerRef}
      className="partner-notification-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      <header>
        <strong>Notifications</strong>
        <button type="button" aria-label="Close notifications" onClick={onClose}>
          <CloseIcon size={19} />
        </button>
      </header>
      <div>
        {compact.map((item) => (
          <Link key={item.id} href={item.destination ?? '/venue/notifications'} onClick={onClose}>
            <CalendarIcon size={20} aria-hidden="true" />
            <span>
              <strong>{item.title}</strong>
              <small>{item.summary}</small>
            </span>
            <time>{item.time}</time>
          </Link>
        ))}
      </div>
      <Link className="partner-notification-all" href="/venue/notifications" onClick={onClose}>
        View all notifications <ForwardIcon size={17} aria-hidden="true" />
      </Link>
    </aside>
  );
}

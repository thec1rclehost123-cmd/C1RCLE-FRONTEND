'use client';

import Link from 'next/link';
import { useRef } from 'react';

import { CalendarIcon, CloseIcon, ForwardIcon } from '@c1rcle/icons';

import { hostNotifications } from '@/components/host/host-studio-model';
import { useOverlayFocus } from '@/components/venue/useOverlayFocus';
import { venueNotifications } from '@/components/venue/venue-notifications-model';

export function VenueNotificationDrawer({
  open,
  onClose,
  trigger,
  role = 'venue',
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly trigger: React.RefObject<HTMLButtonElement | null>;
  readonly role?: 'venue' | 'host' | 'promoter';
}) {
  const drawerRef = useRef<HTMLElement>(null);
  useOverlayFocus({ open, containerRef: drawerRef, restoreFocusRef: trigger, onClose });
  if (!open) return null;
  const compact =
    role === 'host'
      ? hostNotifications.slice(0, 3).map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.body,
          time: item.time,
          destination: item.href,
        }))
      : role === 'venue'
        ? venueNotifications.slice(0, 3)
        : [];
  const allHref =
    role === 'host' ? '/host/notifications' : role === 'venue' ? '/venue/notifications' : null;
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
        {compact.length ? (
          compact.map((item) => (
            <Link key={item.id} href={item.destination ?? allHref ?? '#'} onClick={onClose}>
              <CalendarIcon size={20} aria-hidden="true" />
              <span>
                <strong>{item.title}</strong>
                <small>{item.summary}</small>
              </span>
              <time>{item.time}</time>
            </Link>
          ))
        ) : (
          <p role="status">Notifications are not available for this workspace.</p>
        )}
      </div>
      {allHref ? (
        <Link className="partner-notification-all" href={allHref} onClick={onClose}>
          View all notifications <ForwardIcon size={17} aria-hidden="true" />
        </Link>
      ) : null}
    </aside>
  );
}

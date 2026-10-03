'use client';

import Link from 'next/link';
import { useRef } from 'react';

import { CalendarIcon, CloseIcon, ForwardIcon } from '@c1rcle/icons';

import { useOverlayFocus } from '@/components/venue/useOverlayFocus';

import type { NotificationView } from '@/lib/notifications/notifications-view';

const COMPACT_COUNT = 3;

export function VenueNotificationDrawer({
  open,
  onClose,
  trigger,
  surface,
  views,
  onRead,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly trigger: React.RefObject<HTMLButtonElement | null>;
  readonly surface: 'venue' | 'host' | 'promoter';
  readonly views: readonly NotificationView[];
  readonly onRead: (notificationId: string) => void;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  useOverlayFocus({ open, containerRef: drawerRef, restoreFocusRef: trigger, onClose });

  if (!open) return null;
  const compact = [...views]
    .sort((a, b) => Number(b.unread) - Number(a.unread))
    .slice(0, COMPACT_COUNT);
  const allHref = `/${surface}/notifications`;
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
            <DrawerRow key={item.id} view={item} onRead={onRead} onClose={onClose} />
          ))
        ) : (
          <p role="status">Notifications are not available for this workspace.</p>
        )}
      </div>
      <Link className="partner-notification-all" href={allHref} onClick={onClose}>
        View all notifications <ForwardIcon size={17} aria-hidden="true" />
      </Link>
    </aside>
  );
}

function DrawerRow({
  view,
  onRead,
  onClose,
}: {
  readonly view: NotificationView;
  readonly onRead: (notificationId: string) => void;
  readonly onClose: () => void;
}) {
  const content = (
    <>
      <CalendarIcon size={20} aria-hidden="true" />
      <span>
        <strong>{view.title}</strong>
        <small>{view.summary}</small>
      </span>
      <time>{view.time}</time>
    </>
  );
  if (view.destination) {
    return (
      <Link
        href={view.destination}
        onClick={() => {
          if (view.unread) onRead(view.id);
          onClose();
        }}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        if (view.unread) onRead(view.id);
        onClose();
      }}
    >
      {content}
    </button>
  );
}

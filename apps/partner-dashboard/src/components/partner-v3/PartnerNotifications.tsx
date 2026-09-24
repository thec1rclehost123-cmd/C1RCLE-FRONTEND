'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import {
  AnnouncementIcon,
  BankIcon,
  DoorModeIcon,
  InviteIcon,
  NotificationIcon,
  PartnerIcon,
} from '@c1rcle/icons';

import styles from './partner-v3.module.css';

import type {
  PartnerNotification,
  PartnerNotificationIcon,
  PartnerNotificationsData,
} from '@/data/partner-data-source';

const notificationIcons: Record<PartnerNotificationIcon, typeof BankIcon> = {
  finance: BankIcon,
  partner: PartnerIcon,
  marketing: AnnouncementIcon,
  operations: DoorModeIcon,
  request: InviteIcon,
};

export function PartnerNotifications({ data }: { readonly data: PartnerNotificationsData }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const unreadCount = read
    ? 0
    : data.notifications.filter((notification) => notification.unread).length;

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        close();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (open && rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div className={styles['notificationRoot']} ref={rootRef}>
      <button
        ref={triggerRef}
        className={styles['notificationButton']}
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls="partner-notifications-panel"
        onClick={() => {
          setOpen((value) => !value);
          setRead(true);
        }}
      >
        <NotificationIcon size={18} aria-hidden="true" />
        {unreadCount ? (
          <span
            className={styles['notificationUnreadDot']}
            aria-label={`${String(unreadCount)} unread notifications`}
          />
        ) : null}
      </button>
      {open ? (
        <section
          className={styles['notificationPanel']}
          id="partner-notifications-panel"
          role="dialog"
          aria-label="Notifications"
        >
          <header className={styles['notificationHeader']}>
            <strong>Notifications</strong>
            <button ref={closeButtonRef} type="button" onClick={close}>
              Close
            </button>
          </header>
          {data.notifications.length ? (
            <div className={styles['notificationList']}>
              {data.notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  read={read}
                  onClose={close}
                />
              ))}
            </div>
          ) : (
            <p className={styles['notificationEmpty']} role="status">
              No new notifications.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function NotificationRow({
  notification,
  read,
  onClose,
}: {
  readonly notification: PartnerNotification;
  readonly read: boolean;
  readonly onClose: () => void;
}) {
  const Icon = notificationIcons[notification.icon];
  const content = (
    <>
      <span
        className={[
          styles['notificationIcon'],
          styles[`notificationIcon${notification.type}`],
        ].join(' ')}
      >
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className={styles['notificationCopy']}>
        <span>{notification.description}</span>
        <time>{notification.time}</time>
      </span>
      {notification.unread && !read ? (
        <i className={styles['notificationDot']} aria-label="Unread" />
      ) : null}
    </>
  );
  return notification.href ? (
    <Link className={styles['notificationRow']} href={notification.href} onClick={onClose}>
      {content}
    </Link>
  ) : (
    <div className={styles['notificationRow']}>{content}</div>
  );
}

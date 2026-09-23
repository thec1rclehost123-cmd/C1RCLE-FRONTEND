'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { AnnouncementIcon, BankIcon, DoorModeIcon, InviteIcon, NotificationIcon, PartnerIcon } from '@c1rcle/icons';

import styles from './partner-v3.module.css';

import type { PartnerNotification, PartnerNotificationCategory, PartnerNotificationIcon, PartnerNotificationsData } from '@/data/partner-data-source';
import type { NotificationDecisionDto } from '@c1rcle/contracts';

const notificationIcons: Record<PartnerNotificationIcon, typeof BankIcon> = {
  finance: BankIcon,
  partner: PartnerIcon,
  marketing: AnnouncementIcon,
  operations: DoorModeIcon,
  request: InviteIcon,
};

const notificationTabs: readonly { readonly id: 'all' | PartnerNotificationCategory; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'partners', label: 'Partners' },
  { id: 'events', label: 'Events' },
  { id: 'finance', label: 'Finance' },
  { id: 'ops', label: 'Ops' },
];

export function PartnerNotifications({
  data,
  loading = false,
  error = null,
  unreadCount,
  onRead,
  onMarkAllRead,
  onRefresh,
  onAction,
}: {
  readonly data: PartnerNotificationsData;
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly unreadCount?: number;
  readonly onRead?: (id: string) => void;
  readonly onMarkAllRead?: () => void;
  readonly onRefresh?: () => void;
  readonly onAction?: (id: string, decision: NotificationDecisionDto) => Promise<unknown>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | PartnerNotificationCategory>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const visibleUnreadCount = unreadCount ?? data.notifications.filter((notification) => notification.unread).length;
  const visibleNotifications = activeTab === 'all'
    ? data.notifications
    : data.notifications.filter((notification) => notification.category === activeTab);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => { triggerRef.current?.focus(); });
  };

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) { event.preventDefault(); close(); }
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

  return <div className={styles['notificationRoot']} ref={rootRef}>
    <button ref={triggerRef} className={styles['notificationButton']} type="button" aria-label="Notifications" aria-expanded={open} aria-controls="partner-notifications-panel" onClick={() => { setOpen((value) => !value); }}>
      <NotificationIcon size={18} aria-hidden="true" />
      {visibleUnreadCount ? <span className={styles['notificationUnreadDot']} aria-label={`${String(visibleUnreadCount)} unread notifications`} /> : null}
    </button>
    {open ? <section className={styles['notificationPanel']} id="partner-notifications-panel" role="dialog" aria-label="Notifications">
      <header className={styles['notificationHeader']}>
        <strong>Notifications</strong>
        <div className={styles['notificationHeaderActions']}>
          {visibleUnreadCount > 0 && onMarkAllRead ? <button type="button" onClick={onMarkAllRead}>Mark all read</button> : null}
          {onRefresh ? <button type="button" aria-label="Refresh notifications" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button> : null}
          <button ref={closeButtonRef} type="button" onClick={close}>Close</button>
        </div>
      </header>
      <nav className={styles['notificationTabs']} aria-label="Notification categories">
        {notificationTabs.map((tab) => <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} className={activeTab === tab.id ? styles['notificationTabActive'] : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </nav>
      {error || actionError ? <p className={styles['notificationError']} role="alert">{actionError ?? error}</p> : null}
      {visibleNotifications.length ? <div className={styles['notificationList']}>{visibleNotifications.map((notification) => <NotificationRow key={notification.id} notification={notification} actionLoading={actionLoading === notification.id} onClose={close} onRead={onRead} onAction={onAction ? async (decision) => {
        setActionLoading(notification.id);
        setActionError(null);
        try { await onAction(notification.id, decision); } catch { setActionError('Unable to complete this notification action.'); } finally { setActionLoading(null); }
      } : undefined} />)}</div> : <p className={styles['notificationEmpty']} role="status">{loading ? 'Loading notifications…' : 'No notifications.'}</p>}
    </section> : null}
  </div>;
}

function NotificationRow({ notification, actionLoading, onClose, onRead, onAction }: { readonly notification: PartnerNotification; readonly actionLoading: boolean; readonly onClose: () => void; readonly onRead?: (id: string) => void; readonly onAction?: (decision: NotificationDecisionDto) => Promise<void> }) {
  const Icon = notificationIcons[notification.icon];
  const content = <><span className={[styles['notificationIcon'], styles[`notificationIcon${notification.type}`]].join(' ')}><Icon size={16} aria-hidden="true" /></span><span className={styles['notificationCopy']}>{notification.title ? <strong>{notification.title}</strong> : null}<span>{notification.description}</span><time>{notification.time}</time></span>{notification.unread ? <i className={styles['notificationDot']} aria-label="Unread" /> : null}</>;
  return <article className={styles['notificationItem']}>
    {notification.href ? <Link className={styles['notificationRow']} href={notification.href} onClick={() => { if (notification.unread) onRead?.(notification.id); onClose(); }}>{content}</Link> : <button className={styles['notificationRow']} type="button" onClick={() => { if (notification.unread) onRead?.(notification.id); }}>{content}</button>}
    {notification.href && notification.unread ? <button className={styles['notificationMarkRead']} type="button" onClick={() => onRead?.(notification.id)}>Mark read</button> : null}
    {notification.decisionSupported && onAction ? <div className={styles['notificationQuickActions']}><button type="button" disabled={actionLoading} onClick={() => void onAction('approve')}>{actionLoading ? 'Saving…' : 'Approve'}</button><button type="button" disabled={actionLoading} onClick={() => void onAction('reject')}>Reject</button></div> : null}
  </article>;
}

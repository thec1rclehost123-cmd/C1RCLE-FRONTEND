'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { NotificationIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import {
  loadPartnerInbox,
  markAllPartnerNotificationsRead,
  markPartnerNotificationRead,
} from '@/lib/notifications/partner-inbox-repository';

import styles from './partner-v3.module.css';

import type { StudioRole } from '@/studios/studio-config';
import type { NotificationDto, NotificationsListResponse } from '@c1rcle/contracts';

type InboxState = 'idle' | 'loading' | 'loaded' | 'error';

function usePartnerInbox(organizationId: string | null, enabled: boolean, limit: number) {
  const [state, setState] = useState<InboxState>('idle');
  const [data, setData] = useState<NotificationsListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!enabled || !organizationId) return;
    const lifecycle = { cancelled: false };
    void loadPartnerInbox(organizationId, limit)
      .then((result) => {
        if (lifecycle.cancelled) return;
        setData(result);
        setState('loaded');
      })
      .catch(() => {
        if (lifecycle.cancelled) return;
        setError('Notifications could not be loaded. Retry to check the current inbox.');
        setState('error');
      });
    return () => {
      lifecycle.cancelled = true;
    };
  }, [enabled, limit, organizationId, retry]);

  const markRead = async (notificationId: string) => {
    if (!organizationId || busyId !== null) return;
    setBusyId(notificationId);
    setError(null);
    try {
      const updated = await markPartnerNotificationRead(organizationId, notificationId);
      setData((current) => {
        if (current === null) return current;
        const wasUnread = current.items.some((item) => item.id === notificationId && !item.read);
        return {
          ...current,
          items: current.items.map((item) => (item.id === notificationId ? updated : item)),
          unreadCount: Math.max(0, current.unreadCount - (wasUnread ? 1 : 0)),
        };
      });
    } catch {
      setError('This notification could not be marked as read. Retry the action.');
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (!organizationId || busyId !== null) return;
    setBusyId('all');
    setError(null);
    try {
      await markAllPartnerNotificationsRead(organizationId);
      setData((current) =>
        current === null
          ? current
          : {
              ...current,
              items: current.items.map((item) => ({ ...item, read: true })),
              unreadCount: 0,
            },
      );
    } catch {
      setError('Notifications could not be marked as read. Retry the action.');
    } finally {
      setBusyId(null);
    }
  };

  const loadMore = async () => {
    if (!organizationId || !data?.nextCursor || loadingMore || busyId !== null) return;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = await loadPartnerInbox(organizationId, limit, data.nextCursor);
      setData((current) =>
        current === null
          ? nextPage
          : {
              ...nextPage,
              items: [...current.items, ...nextPage.items],
            },
      );
    } catch {
      setError('Older notifications could not be loaded. Retry the action.');
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    state,
    data,
    error,
    busyId,
    loadingMore,
    markRead,
    markAllRead,
    loadMore,
    retryLoad: () => {
      setError(null);
      setState('loading');
      setRetry((value) => value + 1);
    },
  };
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function NotificationContent({ notification }: { readonly notification: NotificationDto }) {
  return (
    <span className={styles['notificationCopy']}>
      <strong>{notification.title}</strong>
      <span>{notification.body}</span>
      <time dateTime={notification.createdAt}>{formatCreatedAt(notification.createdAt)}</time>
    </span>
  );
}

export function ConnectedPartnerNotifications({
  organizationId,
  studioRole,
}: {
  readonly organizationId: string | null;
  readonly studioRole: StudioRole;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const inbox = usePartnerInbox(organizationId, open, 10);
  const unreadCount = inbox.data?.unreadCount ?? 0;

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
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

  if (!organizationId) {
    return (
      <button
        className={styles['notificationButton']}
        type="button"
        aria-label="Notifications unavailable"
        disabled
      >
        <NotificationIcon size={18} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={styles['notificationRoot']} ref={rootRef}>
      <button
        ref={triggerRef}
        className={styles['notificationButton']}
        type="button"
        aria-label={unreadCount ? `Notifications, ${String(unreadCount)} unread` : 'Notifications'}
        aria-expanded={open}
        aria-controls="partner-notifications-panel"
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <NotificationIcon size={18} aria-hidden="true" />
        {unreadCount > 0 ? (
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
          {inbox.error ? (
            <p className={styles['notificationError']} role="alert">
              {inbox.error}
            </p>
          ) : null}
          {inbox.data && unreadCount > 0 ? (
            <div className={styles['notificationHeader']}>
              <span>{unreadCount} unread</span>
              <button
                type="button"
                disabled={inbox.busyId !== null}
                onClick={() => {
                  void inbox.markAllRead();
                }}
              >
                Mark all read
              </button>
            </div>
          ) : null}
          {inbox.state === 'loading' || inbox.state === 'idle' ? (
            <p className={styles['notificationEmpty']} role="status">
              Loading notifications…
            </p>
          ) : inbox.state === 'error' ? (
            <button
              className={styles['notificationMarkRead']}
              type="button"
              onClick={inbox.retryLoad}
            >
              Retry
            </button>
          ) : inbox.data?.items.length ? (
            <div className={styles['notificationList']}>
              {inbox.data.items.map((notification) => (
                <div className={styles['notificationItem']} key={notification.id}>
                  <div className={styles['notificationRow']}>
                    <NotificationContent notification={notification} />
                    {!notification.read ? (
                      <button
                        className={styles['notificationMarkRead']}
                        type="button"
                        disabled={inbox.busyId !== null}
                        onClick={() => {
                          void inbox.markRead(notification.id);
                        }}
                        aria-label={`Mark ${notification.title} as read`}
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles['notificationEmpty']} role="status">
              No notifications yet.
            </p>
          )}
          <footer className={styles['notificationHeader']}>
            <Link href={`/partner/${studioRole}/notifications`} onClick={close}>
              View all notifications
            </Link>
          </footer>
        </section>
      ) : null}
    </div>
  );
}

export function PartnerNotificationsInboxPage({
  organizationId,
}: {
  readonly organizationId: string | null;
}) {
  const inbox = usePartnerInbox(organizationId, organizationId !== null, 25);

  if (!organizationId) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Notifications unavailable</h1>
        <p className="mt-3 text-sm text-white/65">
          Select an authorized organization to view its inbox.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-8 text-white">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Partner inbox</p>
          <h1 className="mt-2 text-2xl font-semibold">Notifications</h1>
          <p className="mt-2 text-sm text-white/65">
            Updates for this organization, loaded from the C1RCLE backend.
          </p>
        </div>
        {inbox.data && inbox.data.unreadCount > 0 ? (
          <button
            className="rounded-lg border border-white/20 px-3 py-2 text-sm"
            type="button"
            disabled={inbox.busyId !== null}
            onClick={() => {
              void inbox.markAllRead();
            }}
          >
            Mark all read ({inbox.data.unreadCount})
          </button>
        ) : null}
      </header>
      {inbox.error ? (
        <p
          className="mt-5 rounded-lg border border-red-300/20 p-3 text-sm text-red-200"
          role="alert"
        >
          {inbox.error}
        </p>
      ) : null}
      {inbox.data === null && (inbox.state === 'loading' || inbox.state === 'idle') ? (
        <p className="py-10 text-sm text-white/65" role="status">
          Loading notifications…
        </p>
      ) : inbox.data === null && inbox.state === 'error' ? (
        <button
          className="mt-5 rounded-lg border border-white/20 px-3 py-2 text-sm"
          type="button"
          onClick={inbox.retryLoad}
        >
          Retry
        </button>
      ) : inbox.data ? (
        <>
          <p className="py-4 text-xs text-white/55">
            Showing {inbox.data.items.length} of {inbox.data.pageInfo.total} notifications.
            {inbox.data.pageInfo.hasNextPage ? ' Older notifications are available.' : ''}
          </p>
          {inbox.data.items.length ? (
            <div className="divide-y divide-white/10">
              {inbox.data.items.map((notification) => (
                <article
                  className="flex items-start justify-between gap-4 py-4"
                  key={notification.id}
                >
                  <div className="min-w-0">
                    <h2 className="font-medium">{notification.title}</h2>
                    <p className="mt-1 text-sm text-white/70">{notification.body}</p>
                    <time
                      className="mt-2 block text-xs text-white/50"
                      dateTime={notification.createdAt}
                    >
                      {formatCreatedAt(notification.createdAt)}
                    </time>
                  </div>
                  {!notification.read ? (
                    <button
                      className="shrink-0 rounded-md border border-white/20 px-2 py-1 text-xs"
                      type="button"
                      disabled={inbox.busyId !== null}
                      onClick={() => {
                        void inbox.markRead(notification.id);
                      }}
                      aria-label={`Mark ${notification.title} as read`}
                    >
                      Mark read
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs text-white/45">Read</span>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="py-10 text-sm text-white/65" role="status">
              No notifications yet.
            </p>
          )}
          {inbox.data.pageInfo.hasNextPage && inbox.data.nextCursor ? (
            <button
              className="mt-5 rounded-lg border border-white/20 px-3 py-2 text-sm"
              type="button"
              disabled={inbox.loadingMore}
              onClick={() => {
                void inbox.loadMore();
              }}
            >
              {inbox.loadingMore ? 'Loading…' : 'Load older notifications'}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function CurrentPartnerNotificationsInboxPage() {
  const auth = useDashboardAuth();
  if (auth.loading) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-white/65" role="status">
        Loading organization access…
      </p>
    );
  }
  return (
    <PartnerNotificationsInboxPage
      organizationId={auth.profile?.activeMembership?.partnerId ?? null}
    />
  );
}

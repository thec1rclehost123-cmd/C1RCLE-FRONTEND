'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { playNotificationChime } from '@/lib/notifications/notification-sound';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  performNotificationAction,
} from '@/lib/notifications/notifications-repository';
import { toNotificationView } from '@/lib/notifications/notifications-view';

import type { NotificationSurface } from '@/lib/notifications/notifications-surface';
import type { NotificationDecisionDto, NotificationDto } from '@c1rcle/contracts';

const POLL_INTERVAL_MS = 15_000;
const PAGE_SIZE = 50;

/**
 * Org-scoped notification inbox: polls every 15s, drives the bell badge's
 * unread count, marks read/all locally, performs quick actions, and chimes on
 * a newly-arrived unread when the tab is visible. Optimistic updates are
 * reconciled against the response (mark-read is idempotent, so a concurrent
 * poll cannot resurrect a crossed-off row).
 */
export function useNotifications(organizationId: string | null, surface: NotificationSurface) {
  const [rawItems, setRawItems] = useState<readonly NotificationDto[]>([]);
  const [rawUnreadCount, setRawUnreadCount] = useState(0);
  const [rawLoading, setRawLoading] = useState(true);
  const [rawError, setRawError] = useState<string | null>(null);
  // Seed the set on the first successful response so opening the dashboard
  // never chimes for notifications that were already present. Thereafter,
  // compare IDs rather than aggregate counts: a changed count alone cannot
  // tell a genuinely new notification from an older row becoming unread.
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    seenIdsRef.current = null;
  }, [organizationId]);

  const refresh = useCallback(async () => {
    if (organizationId === null) return;
    try {
      const page = await listNotifications(organizationId, { limit: PAGE_SIZE });
      setRawItems(page.items);
      setRawUnreadCount(page.unreadCount);
      setRawError(null);
      const seenIds = seenIdsRef.current;
      const hasNewUnread = seenIds !== null && page.items.some(
        (item) => !item.read && !seenIds.has(item.id),
      );
      if (hasNewUnread) {
        void playNotificationChime();
      }
      const nextSeenIds = seenIds ?? new Set<string>();
      for (const item of page.items) nextSeenIds.add(item.id);
      seenIdsRef.current = nextSeenIds;
    } catch (cause) {
      setRawError(cause instanceof Error ? cause.message : 'Unable to load notifications.');
    } finally {
      setRawLoading(false);
    }
  }, [organizationId]);

  const markRead = useCallback(
    async (notificationId: string) => {
      if (organizationId === null) return;
      setRawItems((current) =>
        current.map((item) =>
          item.id === notificationId && !item.read
            ? { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      );
      setRawUnreadCount((current) => Math.max(0, current - 1));
      try {
        const updated = await markNotificationRead(organizationId, notificationId);
        setRawItems((current) =>
          current.map((item) => (item.id === notificationId ? updated : item)),
        );
      } catch {
        void refresh();
      }
    },
    [organizationId, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (organizationId === null) return;
    setRawItems((current) =>
      current.map((item) =>
        item.read ? item : { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() },
      ),
    );
    setRawUnreadCount(0);
    try {
      await markAllNotificationsRead(organizationId);
      void refresh();
    } catch {
      void refresh();
    }
  }, [organizationId, refresh]);

  const performAction = useCallback(
    async (notificationId: string, decision: NotificationDecisionDto) => {
      if (organizationId === null) return null;
      const updated = await performNotificationAction(organizationId, notificationId, decision);
      setRawItems((current) =>
        current.map((item) => (item.id === notificationId ? updated : item)),
      );
      if (updated.read) {
        setRawUnreadCount((current) => Math.max(0, current - 1));
      }
      return updated;
    },
    [organizationId],
  );

  useEffect(() => {
    // Polling subscribes to an external system; `refresh` only calls setState
    // from async continuations after the awaited network await, never
    // synchronously during this effect's run.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [refresh]);

  const hasOrganization = organizationId !== null;
  const items = useMemo<readonly NotificationDto[]>(
    () => (hasOrganization ? rawItems : []),
    [hasOrganization, rawItems],
  );
  const unreadCount = hasOrganization ? rawUnreadCount : 0;
  const loading = hasOrganization ? rawLoading : false;
  const error = hasOrganization ? rawError : null;

  const views = useMemo(
    () => items.map((item) => toNotificationView(item, surface)),
    [items, surface],
  );

  return {
    items,
    views,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    performAction,
  };
}

export type NotificationsApi = ReturnType<typeof useNotifications>;

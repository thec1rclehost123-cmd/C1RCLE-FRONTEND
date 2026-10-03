import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  ActivityEmptyState,
  ActivityLayout,
  ActivityPager,
} from '@/features/social/components/ActivityLayout';
import { MarkAllReadButton } from '@/features/social/components/MarkAllReadButton';
import { NotificationItem } from '@/features/social/components/NotificationItem';
import { relativeTimeLabel, safeNotificationHref } from '@/features/social/notification-format';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';
import { listMyNotifications } from '@/lib/social/social-api';

import type { NotificationItemView } from '@/features/social/components/NotificationItem';
import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Notifications',
  'New events from the venues and hosts you follow on C1RCLE.',
);

export const dynamic = 'force-dynamic';

interface NotificationsPageProps {
  searchParams?: Promise<{ filter?: string | string[]; cursor?: string | string[] }>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(filter: 'all' | 'unread', cursor?: string) {
  const params = new URLSearchParams();
  if (filter === 'unread') params.set('filter', 'unread');
  if (cursor !== undefined) params.set('cursor', cursor);
  const query = params.toString();
  return query.length > 0 ? `/notifications?${query}` : '/notifications';
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps = {}) {
  await requireGuestSession('/notifications');
  const params = (await searchParams) ?? {};
  const filter = firstValue(params.filter) === 'unread' ? 'unread' : 'all';
  const rawCursor = firstValue(params.cursor);
  const cursor = rawCursor !== undefined && rawCursor.length > 0 ? rawCursor : undefined;

  const result = await listMyNotifications({ cursor, unreadOnly: filter === 'unread' });
  if (result.status === 'unauthenticated') {
    redirect(`/login?next=${encodeURIComponent('/notifications')}`);
  }

  const now = new Date();
  const items: NotificationItemView[] =
    result.status === 'ok'
      ? result.data.items.map((notification) => ({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          href: safeNotificationHref(notification.link),
          timeLabel: relativeTimeLabel(notification.createdAt, now),
          createdAt: notification.createdAt,
          unread: notification.readAt === null,
        }))
      : [];
  const hasUnread = items.some((item) => item.unread);

  return (
    <ActivityLayout
      active="notifications"
      title="Notifications"
      actions={result.status === 'ok' && hasUnread ? <MarkAllReadButton /> : undefined}
    >
      <nav aria-label="Notification filter" className="mb-6 flex gap-4">
        {(['all', 'unread'] as const).map((option) => (
          <Link
            key={option}
            href={pageHref(option)}
            aria-current={option === filter ? 'page' : undefined}
            className={`border-b-2 pb-1 text-[10px] font-black uppercase tracking-[0.2em] ${
              option === filter
                ? 'border-[#FF6842] text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {option === 'all' ? 'All' : 'Unread'}
          </Link>
        ))}
      </nav>

      {result.status === 'unavailable' ? (
        <ActivityEmptyState
          title="Notifications unavailable"
          body="We couldn't load your notifications right now. Please try again in a moment."
          action={{ label: 'Retry', href: pageHref(filter, cursor) }}
        />
      ) : items.length === 0 ? (
        <ActivityEmptyState
          title={filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
          body="Follow venues and hosts to hear the moment they publish a new event."
          action={{ label: 'Find venues & hosts', href: '/hosts' }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </ul>
      )}

      {result.status === 'ok' && (
        <ActivityPager
          newestHref={cursor !== undefined ? pageHref(filter) : null}
          olderHref={
            result.data.nextCursor !== null ? pageHref(filter, result.data.nextCursor) : null
          }
        />
      )}
    </ActivityLayout>
  );
}

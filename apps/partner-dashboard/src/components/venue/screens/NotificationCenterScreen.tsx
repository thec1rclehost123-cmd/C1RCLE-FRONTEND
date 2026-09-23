'use client';

import Link from 'next/link';
import { useState } from 'react';

import { CalendarIcon, CheckIcon, ForwardIcon, SettingsIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { useNotifications } from '@/hooks/use-notifications';

import styles from './NotificationCenter.module.css';

import type { NotificationCategory, NotificationView } from '@/lib/notifications/notifications-view';

const TABS = [
  { id: 'all', label: 'All active' },
  { id: 'events', label: 'Events' },
  { id: 'partners', label: 'Partners' },
  { id: 'finance', label: 'Finance' },
  { id: 'system', label: 'System' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const CATEGORY_BY_TAB: Record<Exclude<TabId, 'all'>, NotificationCategory> = {
  events: 'events',
  partners: 'partners',
  finance: 'finance',
  system: 'system',
};

export function NotificationCenterScreen() {
  const auth = useDashboardAuth();
  const organizationId = auth.profile?.activeMembership?.partnerId ?? null;
  const { views, markRead, markAllRead, error } = useNotifications(organizationId, 'venue');
  const [category, setCategory] = useState<TabId>('all');

  const notifications =
    category === 'all'
      ? views
      : views.filter((view) => view.category === CATEGORY_BY_TAB[category]);
  const today = notifications.filter((item) => !item.time.startsWith('Yesterday'));
  const earlier = notifications.filter((item) => item.time.startsWith('Yesterday'));

  return (
    <section className={styles['page']}>
      <header>
        <div>
          <h1>Notifications</h1>
          <p>Updates needing your attention.</p>
        </div>
        <div>
          <button type="button" onClick={() => void markAllRead()}>
            Mark all as read
          </button>
          <Link href="/venue/settings">
            <SettingsIcon size={18} aria-hidden="true" />
            <span className="sr-only">Notification settings</span>
          </Link>
        </div>
      </header>
      {error ? (
        <div className={styles['empty']}>
          <h2>Notifications unavailable</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <nav aria-label="Notification categories">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-current={category === tab.id ? 'page' : undefined}
                onClick={() => {
                  setCategory(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          {notifications.length ? (
            <div className={styles['groups']}>
              <NotificationGroup label="Today" items={today} onRead={(id) => { void markRead(id); }} />
              <NotificationGroup label="Earlier this week" items={earlier} onRead={(id) => { void markRead(id); }} />
            </div>
          ) : (
            <div className={styles['empty']}>
              <CheckIcon size={28} />
              <h2>All caught up</h2>
              <p>You have no notifications in this category.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function NotificationGroup({
  label,
  items,
  onRead,
}: {
  readonly label: string;
  readonly items: readonly NotificationView[];
  readonly onRead: (notificationId: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section>
      <h2>{label}</h2>
      <div className={styles['list']}>
        {items.map((item) => (
          <NotificationRow key={item.id} view={item} onRead={onRead} />
        ))}
      </div>
    </section>
  );
}

function NotificationRow({
  view,
  onRead,
}: {
  readonly view: NotificationView;
  readonly onRead: (notificationId: string) => void;
}) {
  const forward = (
    <ForwardIcon size={19} aria-hidden="true" />
  );
  return (
    <article data-unread={view.unread ? 'true' : 'false'}>
      <CalendarIcon size={22} aria-hidden="true" />
      <span>
        <strong>{view.title}</strong>
        <small>{view.summary}</small>
      </span>
      <time>{view.time}</time>
      {view.unread ? <i aria-label="Unread" /> : null}
      {view.destination ? (
        <Link
          href={view.destination}
          aria-label={`Open ${view.title}`}
          onClick={() => {
            if (view.unread) onRead(view.id);
          }}
        >
          {forward}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={`Open ${view.title}`}
          onClick={() => {
            if (view.unread) onRead(view.id);
          }}
        >
          {forward}
        </button>
      )}
    </article>
  );
}
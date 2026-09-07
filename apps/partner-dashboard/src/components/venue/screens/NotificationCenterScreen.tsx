'use client';

import Link from 'next/link';
import { useState } from 'react';

import { CalendarIcon, CheckIcon, ForwardIcon, SettingsIcon } from '@c1rcle/icons';

import { filterVenueNotifications } from '../venue-notifications-model';

import styles from './NotificationCenter.module.css';

import type { VenueNotificationCategory } from '../venue-notifications-model';

const TABS: readonly { id: VenueNotificationCategory; label: string }[] = [
  { id: 'all', label: 'All active' },
  { id: 'events', label: 'Events' },
  { id: 'partners', label: 'Partners' },
  { id: 'finance', label: 'Finance' },
  { id: 'system', label: 'System' },
];

export function NotificationCenterScreen() {
  const [category, setCategory] = useState<VenueNotificationCategory>('all');
  const notifications = filterVenueNotifications(category);
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
          <button type="button" disabled title="Marking notifications read is not connected.">
            Mark all as read unavailable
          </button>
          <Link href="/venue/settings">
            <SettingsIcon size={18} aria-hidden="true" />
            <span className="sr-only">Notification settings</span>
          </Link>
        </div>
      </header>
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
          <NotificationGroup label="Today" items={today} />
          <NotificationGroup label="Earlier this week" items={earlier} />
        </div>
      ) : (
        <div className={styles['empty']}>
          <CheckIcon size={28} />
          <h2>All caught up</h2>
          <p>You have no notifications in this category.</p>
        </div>
      )}
    </section>
  );
}

function NotificationGroup({
  label,
  items,
}: {
  readonly label: string;
  readonly items: ReturnType<typeof filterVenueNotifications>;
}) {
  if (!items.length) return null;
  return (
    <section>
      <h2>{label}</h2>
      <div className={styles['list']}>
        {items.map((item) => (
          <article key={item.id} data-unread={item.unread ? 'true' : 'false'}>
            <CalendarIcon size={22} aria-hidden="true" />
            <span>
              <strong>{item.title}</strong>
              <small>{item.summary}</small>
            </span>
            <time>{item.time}</time>
            {item.unread ? <i aria-label="Unread" /> : null}
            {item.destination ? (
              <Link href={item.destination} aria-label={`Open ${item.title}`}>
                <ForwardIcon size={19} />
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { markNotificationsReadAction } from '../actions';

export interface NotificationItemView {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly href: string | null;
  readonly timeLabel: string;
  readonly createdAt: string;
  readonly unread: boolean;
}

export function NotificationItem({
  notification,
}: {
  readonly notification: NotificationItemView;
}) {
  const [unread, setUnread] = useState(notification.unread);
  const [, startTransition] = useTransition();

  const markRead = () => {
    if (!unread) return;
    setUnread(false);
    startTransition(async () => {
      const ok = await markNotificationsReadAction([notification.id]);
      if (!ok) setUnread(true);
    });
  };

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`mt-2 size-2 shrink-0 rounded-full ${unread ? 'bg-[#FF6842]' : 'bg-transparent'}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black uppercase tracking-[0.04em] text-white">
          {notification.title}
          {unread && <span className="sr-only"> (unread)</span>}
        </span>
        {notification.body.length > 0 && (
          <span className="mt-1 block text-sm leading-6 text-white/60">{notification.body}</span>
        )}
        <time
          dateTime={notification.createdAt}
          className="mt-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/35"
        >
          {notification.timeLabel}
        </time>
      </span>
    </>
  );

  const rowClass = `flex w-full gap-4 rounded-3xl border px-5 py-4 text-left transition-colors duration-200 motion-reduce:transition-none ${
    unread
      ? 'border-[#FF6842]/30 bg-[#FF6842]/[0.06] hover:bg-[#FF6842]/[0.1]'
      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
  }`;

  return (
    <li>
      {notification.href !== null ? (
        <Link href={notification.href} onClick={markRead} className={rowClass}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={markRead} disabled={!unread} className={rowClass}>
          {content}
        </button>
      )}
    </li>
  );
}

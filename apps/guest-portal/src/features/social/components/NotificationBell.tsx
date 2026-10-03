'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NotificationIcon } from '@c1rcle/icons';

/**
 * Navbar entry to the notification inbox. Always rendered (anonymous guests
 * land on login via the private-route proxy) so it never shifts the navbar;
 * the unread badge appears once the count resolves.
 */
export function NotificationBell({ count }: { readonly count: number | null }) {
  const pathname = usePathname();
  const unread = count ?? 0;
  const label = unread > 0 ? `Notifications, ${String(unread)} unread` : 'Notifications';

  return (
    <Link
      href="/notifications"
      aria-label={label}
      aria-current={pathname === '/notifications' ? 'page' : undefined}
      className="relative flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-xl transition-colors duration-200 hover:border-white/40 motion-reduce:transition-none"
    >
      <NotificationIcon aria-hidden="true" className="size-[18px]" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-[#FF6842] px-1 text-[9px] font-black leading-[18px] text-black"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}

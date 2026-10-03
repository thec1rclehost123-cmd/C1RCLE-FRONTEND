'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getUnreadCountAction } from './actions';

/**
 * The signed-in guest's unread notification count, or `null` when there is
 * no session (or the inbox is unreachable). Read through a Server Action
 * because the session cookie is httpOnly and the guest portal holds no
 * browser-side token; re-read on navigation so opening a notification clears
 * the badge. Display state only — the gateway authorizes every call.
 */
export function useUnreadCount(): number | null {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUnreadCountAction()
      .then((next) => {
        if (!cancelled) setCount(next);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return count;
}

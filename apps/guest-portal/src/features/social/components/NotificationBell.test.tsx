import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUnreadCount } from '../use-unread-count';

import { NotificationBell } from './NotificationBell';

const getUnreadCountAction = vi.fn<() => Promise<number | null>>();

vi.mock('../actions', () => ({
  getUnreadCountAction: () => getUnreadCountAction(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/explore',
}));

describe('NotificationBell', () => {
  it('shows a capped unread badge', () => {
    render(<NotificationBell count={12} />);

    expect(screen.getByRole('link', { name: 'Notifications, 12 unread' })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('renders a plain inbox link when there is no count', () => {
    render(<NotificationBell count={null} />);

    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByText('9+')).not.toBeInTheDocument();
  });
});

describe('useUnreadCount', () => {
  beforeEach(() => {
    getUnreadCountAction.mockReset();
  });

  it('resolves the count from the server action', async () => {
    getUnreadCountAction.mockResolvedValue(3);
    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current).toBe(3);
    });
  });

  it('stays null for an anonymous guest or a failed read', async () => {
    getUnreadCountAction.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(getUnreadCountAction).toHaveBeenCalledTimes(1);
    });
    expect(result.current).toBeNull();
  });
});

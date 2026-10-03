import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationBell } from './NotificationBell';

const getUnreadCountAction = vi.fn<() => Promise<number | null>>();

vi.mock('../actions', () => ({
  getUnreadCountAction: () => getUnreadCountAction(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/explore',
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    getUnreadCountAction.mockReset();
  });

  it('shows a capped unread badge once the count resolves', async () => {
    getUnreadCountAction.mockResolvedValue(12);
    render(<NotificationBell />);

    expect(await screen.findByRole('link', { name: 'Notifications, 12 unread' })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('renders a plain inbox link for an anonymous guest', async () => {
    getUnreadCountAction.mockResolvedValue(null);
    render(<NotificationBell />);

    expect(await screen.findByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(getUnreadCountAction).toHaveBeenCalledTimes(1);
  });
});

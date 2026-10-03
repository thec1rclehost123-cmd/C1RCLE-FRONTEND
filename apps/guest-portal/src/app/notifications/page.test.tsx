import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationsPage from './page';

import type { SessionResult } from '@/lib/social/social-api';
import type { NotificationListResponse } from '@c1rcle/contracts';

const listMyNotifications =
  vi.fn<(input: unknown) => Promise<SessionResult<NotificationListResponse>>>();

vi.mock('@/lib/social/social-api', () => ({
  listMyNotifications: (input: unknown) => listMyNotifications(input),
}));

vi.mock('@/lib/auth/require-session', () => ({
  requireGuestSession: vi.fn(() => Promise.resolve({ user: { id: 'guest-1' } })),
}));

vi.mock('@/features/social/actions', () => ({
  markAllNotificationsReadAction: vi.fn(),
  markNotificationsReadAction: vi.fn(),
}));

const redirect = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});
vi.mock('next/navigation', () => ({
  redirect: (href: string) => redirect(href),
}));

function page(items: NotificationListResponse['items'], nextCursor: string | null = null) {
  return {
    status: 'ok',
    data: {
      items,
      nextCursor,
      pageInfo: { page: 1, pageSize: 20, total: items.length, hasNextPage: nextCursor !== null },
    },
  } as const;
}

const unread = {
  id: 'n-1',
  type: 'event.new_from_followed',
  title: 'New event: Rooftop Jazz',
  body: 'A venue you follow just published a new event.',
  link: '/event/rooftop-jazz',
  subjectId: 'event-1',
  createdAt: '2026-10-03T09:00:00.000Z',
  readAt: null,
} as const;

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists notifications with links, unread state and pagination', async () => {
    listMyNotifications.mockResolvedValue(
      page(
        [
          unread,
          { ...unread, id: 'n-2', title: 'New event: Neon Nights', readAt: unread.createdAt },
        ],
        'cursor-2',
      ),
    );

    render(await NotificationsPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Rooftop Jazz\s*\(unread\)/ })).toHaveAttribute(
      'href',
      '/event/rooftop-jazz',
    );
    expect(screen.getByRole('link', { name: /Neon Nights/ })).not.toHaveTextContent('(unread)');
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Older →' })).toHaveAttribute(
      'href',
      '/notifications?cursor=cursor-2',
    );
  });

  it('passes the unread filter and cursor through to the API', async () => {
    listMyNotifications.mockResolvedValue(page([]));

    render(
      await NotificationsPage({
        searchParams: Promise.resolve({ filter: 'unread', cursor: 'c-1' }),
      }),
    );

    expect(listMyNotifications).toHaveBeenCalledWith({ cursor: 'c-1', unreadOnly: true });
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Newest' })).toHaveAttribute(
      'href',
      '/notifications?filter=unread',
    );
  });

  it('drops unsafe notification links instead of rendering them', async () => {
    listMyNotifications.mockResolvedValue(page([{ ...unread, link: '//evil.test' }]));

    render(await NotificationsPage());

    expect(screen.getByRole('button', { name: /Rooftop Jazz/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Rooftop Jazz/ })).not.toBeInTheDocument();
  });

  it('renders an honest retry state when the API is unavailable', async () => {
    listMyNotifications.mockResolvedValue({ status: 'unavailable' });

    render(await NotificationsPage());

    expect(screen.getByText('Notifications unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retry' })).toHaveAttribute('href', '/notifications');
  });

  it('sends an expired session back to login', async () => {
    listMyNotifications.mockResolvedValue({ status: 'unauthenticated' });

    await expect(NotificationsPage()).rejects.toThrow('redirect:/login?next=%2Fnotifications');
  });
});

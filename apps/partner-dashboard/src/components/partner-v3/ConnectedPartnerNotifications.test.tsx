import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadPartnerInbox,
  markAllPartnerNotificationsRead,
  markPartnerNotificationRead,
} from '@/lib/notifications/partner-inbox-repository';

import {
  ConnectedPartnerNotifications,
  notificationActionHref,
  PartnerNotificationsInboxPage,
} from './ConnectedPartnerNotifications';

vi.mock('@/lib/notifications/partner-inbox-repository', () => ({
  loadPartnerInbox: vi.fn(),
  markAllPartnerNotificationsRead: vi.fn(),
  markPartnerNotificationRead: vi.fn(),
}));

vi.mock('@c1rcle/icons', () => ({ NotificationIcon: () => <svg aria-hidden="true" /> }));

const item = {
  id: 'notification_1',
  recipientId: 'promoter_org_1',
  recipientType: 'promoter' as const,
  type: 'promoter_assignment.invited',
  title: 'New campaign invitation',
  body: 'A Host invited your organization to promote an event.',
  read: false,
  readAt: null,
  data: { assignmentId: 'assignment_1' },
  action: null,
  priority: 'normal' as const,
  createdAt: '2026-10-28T12:00:00.000Z',
};

const page = (overrides: Record<string, unknown> = {}) => ({
  items: [item],
  pageInfo: { page: 1, pageSize: 10, total: 1, hasNextPage: false },
  nextCursor: null,
  unreadCount: 1,
  ...overrides,
});

const mockLoad = vi.mocked(loadPartnerInbox);
const mockMark = vi.mocked(markPartnerNotificationRead);
const mockMarkAll = vi.mocked(markAllPartnerNotificationsRead);

beforeEach(() => {
  mockLoad.mockReset();
  mockMark.mockReset();
  mockMarkAll.mockReset();
});

describe('ConnectedPartnerNotifications', () => {
  it('routes actionable Host and Venue notifications to their current request views', () => {
    const slotRequest = {
      ...item,
      action: { resourceType: 'slot_request' as const, resourceId: 'request / 1' },
    };
    const partnership = {
      ...item,
      action: { resourceType: 'partnership' as const, resourceId: 'partnership_1' },
    };

    expect(notificationActionHref(slotRequest, 'host')).toBe(
      '/partner/host/slot-requests?request=request%20%2F%201',
    );
    expect(notificationActionHref(slotRequest, 'venue')).toBe(
      '/partner/venue/slot-requests?request=request%20%2F%201',
    );
    expect(notificationActionHref(partnership, 'host')).toBe(
      '/partner/host/partners?view=requests',
    );
  });

  it('routes older partnership notifications without an action to the request inbox', () => {
    const oldPartnershipNotification = {
      ...item,
      recipientType: 'host' as const,
      type: 'partnership.requested',
      action: null,
    };

    expect(notificationActionHref(oldPartnershipNotification, 'host')).toBe(
      '/partner/host/partners?view=requests',
    );
    expect(notificationActionHref(oldPartnershipNotification, 'venue')).toBe(
      '/partner/venue/partners?view=requests',
    );
    expect(notificationActionHref(oldPartnershipNotification, 'promoter')).toBeNull();
    expect(notificationActionHref(item, 'host')).toBeNull();
  });

  it('routes promoter connection actions to the role-appropriate partner view', () => {
    const notification = {
      ...item,
      action: { resourceType: 'promoter_connection' as const, resourceId: 'connection_1' },
    };

    expect(notificationActionHref(notification, 'promoter')).toBe(
      '/partner/promoter/partners?tab=incoming',
    );
    expect(notificationActionHref(notification, 'host')).toBe(
      '/partner/host/partners?tab=promoters&view=requests',
    );
    expect(notificationActionHref({ ...item, action: null }, 'host')).toBeNull();
  });

  it('loads the organization inbox, marks an item read, and links to the full page', async () => {
    const user = userEvent.setup();
    mockLoad.mockResolvedValue(page());
    mockMark.mockResolvedValue({ ...item, read: true, readAt: '2026-10-28T12:05:00.000Z' });

    render(<ConnectedPartnerNotifications organizationId="promoter_org_1" studioRole="promoter" />);
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('New campaign invitation')).toBeInTheDocument();
    expect(mockLoad).toHaveBeenCalledWith('promoter_org_1', 10);
    await user.click(screen.getByRole('button', { name: 'Mark New campaign invitation as read' }));
    expect(mockMark).toHaveBeenCalledWith('promoter_org_1', 'notification_1');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'View all notifications' })).toHaveAttribute(
      'href',
      '/partner/promoter/notifications',
    );
  });

  it('shows an explicit retry state when the inbox read fails', async () => {
    const user = userEvent.setup();
    mockLoad
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(page({ items: [], unreadCount: 0 }));
    render(<ConnectedPartnerNotifications organizationId="promoter_org_1" studioRole="promoter" />);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Notifications could not be loaded');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No notifications yet.')).toBeInTheDocument();
  });
});

describe('PartnerNotificationsInboxPage', () => {
  it('loads older pages using the backend cursor and appends them without losing unread state', async () => {
    const user = userEvent.setup();
    const older = { ...item, id: 'notification_2', title: 'Earlier campaign update' };
    mockLoad
      .mockResolvedValueOnce(
        page({
          pageInfo: { page: 1, pageSize: 25, total: 2, hasNextPage: true },
          nextCursor: 'cursor_2',
        }),
      )
      .mockResolvedValueOnce(
        page({
          items: [older],
          pageInfo: { page: 1, pageSize: 25, total: 2, hasNextPage: false },
          nextCursor: null,
          unreadCount: 2,
        }),
      );
    mockMarkAll.mockResolvedValue({ selected: 2 });

    render(<PartnerNotificationsInboxPage organizationId="promoter_org_1" />);
    expect(await screen.findByText('New campaign invitation')).toBeInTheDocument();
    expect(
      screen.getByText('Showing 1 of 2 notifications. Older notifications are available.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load older notifications' }));

    expect(await screen.findByText('Earlier campaign update')).toBeInTheDocument();
    expect(mockLoad).toHaveBeenNthCalledWith(1, 'promoter_org_1', 25);
    expect(mockLoad).toHaveBeenNthCalledWith(2, 'promoter_org_1', 25, 'cursor_2');
    await user.click(screen.getByRole('button', { name: 'Mark all read (2)' }));
    expect(mockMarkAll).toHaveBeenCalledWith('promoter_org_1');
    expect(await screen.findAllByText('Read')).toHaveLength(2);
  });

  it('does not present a missing organization as an empty inbox', () => {
    render(<PartnerNotificationsInboxPage organizationId={null} />);
    expect(screen.getByRole('heading', { name: 'Notifications unavailable' })).toBeInTheDocument();
    expect(screen.queryByText('No notifications yet.')).not.toBeInTheDocument();
    expect(mockLoad).not.toHaveBeenCalled();
  });
});

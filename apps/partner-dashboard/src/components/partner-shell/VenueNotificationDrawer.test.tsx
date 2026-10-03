import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VenueNotificationDrawer } from './VenueNotificationDrawer';

import type { NotificationView } from '@/lib/notifications/notifications-view';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@c1rcle/icons', () => ({
  CalendarIcon: () => <svg aria-hidden="true" />,
  CloseIcon: () => <svg aria-hidden="true" />,
  ForwardIcon: () => <svg aria-hidden="true" />,
}));

function view(overrides: Partial<NotificationView>): NotificationView {
  return {
    id: 'n-1',
    title: 'New partnership request',
    summary: 'Skyline Rooftop wants to partner with you.',
    time: 'Today, 10:24 AM',
    category: 'partners',
    unread: true,
    destination: '/venue/partners',
    resourceType: 'partnership',
    decisionSupported: true,
    ...overrides,
  };
}

describe('VenueNotificationDrawer', () => {
  it('shows real unread notifications first with their destination', () => {
    const views = [
      view({ id: 'n-1', destination: '/venue/partners' }),
      view({ id: 'n-2', unread: false, destination: '/venue/events', title: 'Event published' }),
    ];
    const onRead = vi.fn();

    render(
      <VenueNotificationDrawer
        open
        onClose={vi.fn()}
        trigger={{ current: null }}
        surface="venue"
        views={views}
        onRead={onRead}
      />,
    );

    expect(screen.getByRole('link', { name: /new partnership request/i })).toHaveAttribute(
      'href',
      '/venue/partners',
    );
    expect(screen.getByRole('link', { name: /view all notifications/i })).toHaveAttribute(
      'href',
      '/venue/notifications',
    );
    expect(
      screen.queryByRole('button', { name: /new partnership request/i }),
    ).not.toBeInTheDocument();
    expect(onRead).not.toHaveBeenCalled();
  });

  it('marks a row read when clicked, then closes the drawer', () => {
    const onRead = vi.fn();
    const onClose = vi.fn();

    render(
      <VenueNotificationDrawer
        open
        onClose={onClose}
        trigger={{ current: null }}
        surface="host"
        views={[view({ id: 'n-9', destination: null, title: 'Slot request received' })]}
        onRead={onRead}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /slot request received/i }));
    expect(onRead).toHaveBeenCalledWith('n-9');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an empty state when the org has no notifications', () => {
    render(
      <VenueNotificationDrawer
        open
        onClose={vi.fn()}
        trigger={{ current: null }}
        surface="promoter"
        views={[]}
        onRead={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('not available');
    expect(screen.getByRole('link', { name: /view all notifications/i })).toHaveAttribute(
      'href',
      '/promoter/notifications',
    );
  });
});

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { VenueNotificationDrawer } from './VenueNotificationDrawer';

import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    readonly children: ReactNode;
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

describe('VenueNotificationDrawer', () => {
  it('does not expose Venue notifications or a Venue destination to Promoters', () => {
    render(
      createElement(VenueNotificationDrawer, {
        open: true,
        onClose: vi.fn(),
        trigger: { current: null },
        role: 'promoter',
      }),
    );

    expect(screen.getByRole('status')).toHaveTextContent('not available');
    expect(screen.queryByRole('link', { name: /view all notifications/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /payout completed/i })).not.toBeInTheDocument();
  });

  it('keeps role-owned notification destinations for Host', () => {
    render(
      createElement(VenueNotificationDrawer, {
        open: true,
        onClose: vi.fn(),
        trigger: { current: null },
        role: 'host',
      }),
    );

    expect(screen.getByRole('link', { name: /view all notifications/i })).toHaveAttribute(
      'href',
      '/host/notifications',
    );
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HostEventSummaryScreen } from './HostEventDetailScreen';

import type { ReactNode } from 'react';

const auth = vi.hoisted(() => ({ canDo: vi.fn((_permission: string) => false) }));

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => auth,
}));

vi.mock('next/image', () => ({
  default: () => <span aria-hidden="true" />,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/host/events/neon-nights',
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CalendarIcon: Icon,
    ChevronDownIcon: Icon,
    DoorModeIcon: Icon,
    EditIcon: Icon,
    LocationIcon: Icon,
  };
});

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

describe('HostEventDetailScreen', () => {
  it('does not expose Edit or Door Mode without the matching permissions', () => {
    auth.canDo.mockReturnValue(false);
    render(<HostEventSummaryScreen id="neon-nights" />);

    expect(screen.getByRole('heading', { name: 'Neon Nights: Afrobeats' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Guests' })).toHaveAttribute(
      'href',
      '/host/events/neon-nights/guests',
    );
    expect(screen.queryByRole('link', { name: /edit event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open door mode/i })).not.toBeInTheDocument();
  });

  it('keeps Door Mode behind its explicit permission and preserves the existing route', () => {
    auth.canDo.mockImplementation((permission: string) => permission === 'canManageDoorMode');
    render(<HostEventSummaryScreen id="neon-nights" />);

    expect(screen.getByRole('link', { name: /open door mode/i })).toHaveAttribute(
      'href',
      '/venue/door?eventId=neon-nights',
    );
    expect(screen.queryByRole('link', { name: /edit event/i })).not.toBeInTheDocument();
  });
});

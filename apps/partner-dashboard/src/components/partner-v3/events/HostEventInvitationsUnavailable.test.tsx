import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HostEventInvitationsUnavailable } from './HostEventInvitationsUnavailable';

import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('HostEventInvitationsUnavailable', () => {
  it('explains the unavailable invitation integration and links to live slot requests', () => {
    render(<HostEventInvitationsUnavailable />);

    expect(
      screen.getByRole('heading', { name: 'Event invitations unavailable' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not connected to an authoritative service/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Host Slot Requests' })).toHaveAttribute(
      'href',
      '/partner/host/slot-requests',
    );
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DoorModeScreen } from './DoorModeScreen';
import { SlotRequestsScreen } from './SlotRequestsScreen';

vi.mock('../Icon', () => ({ Icon: () => <svg aria-hidden="true" /> }));

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    grantedPermissions: ['*'],
    hasPermission: () => true,
    canDo: () => true,
  }),
}));

describe('final Venue workflow interactions', () => {
  it('keeps unsupported slot request actions unavailable', async () => {
    const user = userEvent.setup();
    render(<SlotRequestsScreen tab="pending" />);
    const row = screen.getByText('Sunset Sessions Vol. 4').closest('button');
    expect(row).not.toBeNull();
    await user.click(row!);
    expect(screen.getByRole('button', { name: 'Accept request' })).toBeDisabled();
    expect(screen.getByText(/mutation adapters are unavailable/i)).toBeInTheDocument();
  });

  it('changes check-in UI only after the supplied adapter resolves', async () => {
    const user = userEvent.setup();
    let resolveCheckIn: ((value: { guestId: string; checkedInAt: string }) => void) | undefined;
    const checkIn = vi.fn(
      () =>
        new Promise<{ guestId: string; checkedInAt: string }>((resolve) => {
          resolveCheckIn = resolve;
        }),
    );
    render(<DoorModeScreen tab="guests" adapters={{ checkIn }} />);
    const row = screen.getByText('Rohan Mehta').closest('[role="row"]');
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Check in' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(checkIn).toHaveBeenCalled();
    expect(screen.queryByText('Guest checked in.')).not.toBeInTheDocument();
    resolveCheckIn?.({ guestId: 'guest-4', checkedInAt: 'Now' });
    expect(await screen.findByText('Guest checked in.')).toBeInTheDocument();
  });
});

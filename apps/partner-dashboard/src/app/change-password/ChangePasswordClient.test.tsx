import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChangePasswordClient } from './ChangePasswordClient';

const mocks = vi.hoisted(() => ({
  status: 'authenticated',
  hydrated: true,
  mustChangePassword: true,
  next: null as string | null,
  push: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => ({ get: (key: string) => (key === 'next' ? mocks.next : null) }),
}));

vi.mock('@c1rcle/auth', () => ({
  useSessionStore: () => ({
    status: mocks.status,
    hydrated: mocks.hydrated,
    session:
      mocks.status === 'authenticated'
        ? {
            user: {
              id: 'u1',
              email: 'staff@example.com',
              displayName: 'Staff',
              role: 'partner',
              avatarUrl: null,
              mustChangePassword: mocks.mustChangePassword,
            },
          }
        : null,
  }),
  changePassword: mocks.changePassword,
}));

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'TempPass12345678' } });
  fireEvent.change(screen.getByLabelText('New password (min 8 characters)'), {
    target: { value: 'brand-new-password-1' },
  });
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: 'brand-new-password-1' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Set password' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.status = 'authenticated';
  mocks.hydrated = true;
  mocks.mustChangePassword = true;
  mocks.next = null;
});

describe('ChangePasswordClient', () => {
  it('rotates the password and follows the return destination', async () => {
    mocks.next = '/invitations/inv-1/accept';
    mocks.changePassword.mockResolvedValue(undefined);
    render(<ChangePasswordClient />);

    fillAndSubmit();

    await waitFor(() => {
      expect(mocks.changePassword).toHaveBeenCalledWith({
        currentPassword: 'TempPass12345678',
        newPassword: 'brand-new-password-1',
      });
    });
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith('/invitations/inv-1/accept');
    });
  });

  it('blocks mismatched confirmation client-side', () => {
    render(<ChangePasswordClient />);

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'TempPass12345678' } });
    fireEvent.change(screen.getByLabelText('New password (min 8 characters)'), {
      target: { value: 'brand-new-password-1' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'different-password-2' },
    });

    expect(screen.getByRole('button', { name: 'Set password' })).toBeDisabled();
    expect(screen.getByText("New passwords don't match.")).toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it('surfaces server failures without navigating', async () => {
    mocks.changePassword.mockRejectedValue(new Error('Current password is incorrect'));
    render(<ChangePasswordClient />);

    fillAndSubmit();

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('asks anonymous users to sign in first', () => {
    mocks.status = 'anonymous';
    render(<ChangePasswordClient />);

    expect(screen.getByText('Sign in first')).toBeInTheDocument();
  });
});

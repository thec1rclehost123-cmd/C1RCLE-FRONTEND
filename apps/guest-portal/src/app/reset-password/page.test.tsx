import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, statusToErrorCode } from '@c1rcle/api-client';
import { resetPassword } from '@c1rcle/auth';

import { ResetPasswordClient } from './reset-password-client';

const replace = vi.fn();
let search = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock('@c1rcle/auth', () => ({ resetPassword: vi.fn() }));
const mockReset = vi.mocked(resetPassword);

function fill(password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: /update password/i }));
}

describe('ResetPasswordClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = 'token=secret-tok';
  });

  it('captures the token then strips it from the URL', async () => {
    render(<ResetPasswordClient />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/reset-password');
    });
  });

  it('shows a request-new-link state when no token is present', async () => {
    search = '';
    render(<ResetPasswordClient />);
    expect(await screen.findByRole('link', { name: /request a new link/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('validates length and confirmation before calling the backend', async () => {
    render(<ResetPasswordClient />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
    });

    fill('short', 'short');
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8/i);
    fill('password123', 'different123');
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('submits the captured token and shows success', async () => {
    mockReset.mockResolvedValue(undefined);
    render(<ResetPasswordClient />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
    });

    fill('password123', 'password123');

    expect(await screen.findByRole('link', { name: /go to sign in/i })).toBeInTheDocument();
    expect(mockReset).toHaveBeenCalledWith({ token: 'secret-tok', newPassword: 'password123' });
  });

  it('maps a backend rejection to an expired-link message', async () => {
    mockReset.mockRejectedValue(
      new ApiClientError({
        status: 400,
        code: statusToErrorCode(400),
        message: 'bad token',
        requestId: undefined,
        fieldErrors: undefined,
      }),
    );
    render(<ResetPasswordClient />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
    });

    fill('password123', 'password123');

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or has expired/i);
    expect(screen.queryByText(/secret-tok|bad token/)).not.toBeInTheDocument();
  });
});

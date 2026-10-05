import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, statusToErrorCode } from '@c1rcle/api-client';
import { requestPasswordReset } from '@c1rcle/auth';

import { ForgotPasswordClient } from './forgot-password-client';

vi.mock('@c1rcle/auth', () => ({ requestPasswordReset: vi.fn() }));
const mockRequest = vi.mocked(requestPasswordReset);

function submit(email: string) {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
}

describe('ForgotPasswordClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the same non-committal confirmation after a successful request', async () => {
    mockRequest.mockResolvedValue(undefined);
    render(<ForgotPasswordClient />);

    submit('ghost@x.com');

    expect(await screen.findByRole('status')).toHaveTextContent(
      /if an account exists for that email/i,
    );
    expect(mockRequest).toHaveBeenCalledWith('ghost@x.com');
  });

  it('tells the user to wait on a 429', async () => {
    mockRequest.mockRejectedValue(
      new ApiClientError({ status: 429, code: statusToErrorCode(429), message: 'x' }),
    );
    render(<ForgotPasswordClient />);

    submit('a@x.com');

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many requests/i);
  });

  it('reports a malformed email from client-side validation', async () => {
    mockRequest.mockRejectedValue(new Error('invalid email'));
    render(<ForgotPasswordClient />);

    submit('nope');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
    });
  });
});

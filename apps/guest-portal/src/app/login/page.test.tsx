import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, statusToErrorCode } from '@c1rcle/api-client';
import { login } from '@c1rcle/auth';

import { LoginPageClient } from './login-page-client';

const assignDocument = vi.fn();
const replace = vi.fn();
const refreshRouter = vi.fn();
let search = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh: refreshRouter }),
  useSearchParams: () => new URLSearchParams(search),
}));

vi.mock('@c1rcle/auth', () => ({ login: vi.fn() }));

const mockLogin = vi.mocked(login);

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: password } });
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = '';
    vi.stubGlobal('location', { assign: assignDocument });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a real email and password form with no fixture OTP or social stubs', () => {
    render(<LoginPageClient />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.queryByText(/demo code|fixture|preview|123456/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot your password/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('signs in through @c1rcle/auth and returns to the validated next path', async () => {
    search = 'next=/tickets';
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPageClient />);

    fill(' g@x.com ', 'password123');
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(assignDocument).toHaveBeenCalledWith('/tickets');
    });
    expect(mockLogin).toHaveBeenCalledWith({ email: 'g@x.com', password: 'password123' });
    expect(replace).not.toHaveBeenCalled();
    expect(refreshRouter).not.toHaveBeenCalled();
  });

  it('ignores an open-redirect next target', async () => {
    search = 'next=https://evil.example';
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPageClient />);

    fill('g@x.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(assignDocument).toHaveBeenCalledWith('/profile');
    });
  });

  it('shows one generic message for bad credentials and stays on the page', async () => {
    mockLogin.mockRejectedValue(new Error('Authentication failed'));
    render(<LoginPageClient />);

    fill('g@x.com', 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect email or password/i);
    expect(replace).not.toHaveBeenCalled();
    expect(refreshRouter).not.toHaveBeenCalled();
    expect(assignDocument).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeEnabled();
  });

  it('shows a back-off message on rate limiting', async () => {
    mockLogin.mockRejectedValue(
      new ApiClientError({
        status: 429,
        code: statusToErrorCode(429),
        message: 'x',
        requestId: undefined,
        fieldErrors: undefined,
      }),
    );
    render(<LoginPageClient />);

    fill('g@x.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i);
  });

  it('keeps submission pending until authentication succeeds, then performs one document navigation', async () => {
    let complete: (() => void) | undefined;
    mockLogin.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    render(<LoginPageClient />);
    fill('g@x.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    expect(assignDocument).not.toHaveBeenCalled();
    complete?.();
    await waitFor(() => {
      expect(assignDocument).toHaveBeenCalledOnce();
    });
    expect(assignDocument).toHaveBeenCalledWith('/profile');
    expect(replace).not.toHaveBeenCalled();
    expect(refreshRouter).not.toHaveBeenCalled();
  });

  it('explains an expired session', () => {
    search = 'next=/profile&reason=expired';
    render(<LoginPageClient />);
    expect(screen.getByRole('status')).toHaveTextContent(/session expired/i);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signup } from '@c1rcle/auth';

import { sendEmailVerification, verifyEmail } from '@/lib/auth/email-verification';

import { SignupClient } from './signup-client';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams('next=https://attacker.example'),
}));
vi.mock('@c1rcle/auth', () => ({ signup: vi.fn(), fetchSession: vi.fn() }));
vi.mock('@/lib/auth/email-verification', () => ({
  sendEmailVerification: vi.fn(),
  verifyEmail: vi.fn(),
}));
function create() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Synthetic' } });
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'synthetic@example.invalid' },
  });
  for (const label of ['Password', 'Confirm password'])
    fireEvent.change(screen.getByLabelText(label), { target: { value: 'Synthetic-password-16' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
}
describe('Guest signup', () => {
  beforeEach(() => vi.resetAllMocks());
  it('keeps the created account when delivery fails and retries only the code', async () => {
    vi.mocked(sendEmailVerification)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    render(<SignupClient />);
    create();
    fireEvent.click(await screen.findByRole('button', { name: 'Send verification code' }));
    expect(await screen.findByLabelText('Verification code')).toBeInTheDocument();
    expect(signup).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });
  it('verifies before redirecting and rejects an external return destination', async () => {
    render(<SignupClient />);
    create();
    fireEvent.change(await screen.findByLabelText('Verification code'), {
      target: { value: '123456' },
    });
    expect(replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }));
    await vi.waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/profile');
    });
    expect(verifyEmail).toHaveBeenCalledWith('synthetic@example.invalid', '123456');
  });
  it('resumes verification for the session identity without creating an account again', async () => {
    render(<SignupClient initialEmail="existing@example.invalid" />);
    fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }));
    expect(await screen.findByLabelText('Verification code')).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
    expect(sendEmailVerification).toHaveBeenCalledWith('existing@example.invalid');
  });
});

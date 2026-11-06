import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { requestPasswordReset } from '@c1rcle/auth';

import { ForgotPasswordPageClient } from './PageClient';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@c1rcle/auth', () => ({ requestPasswordReset: vi.fn() }));

describe('Partner recovery failures', () => {
  it('offers retry guidance for a network failure with a valid email', async () => {
    vi.mocked(requestPasswordReset).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<ForgotPasswordPageClient />);
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'synthetic@example.invalid' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/try again shortly/i);
  });
});

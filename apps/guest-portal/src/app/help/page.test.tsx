import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HelpPage from './page';

vi.mock('@/lib/auth/require-session', () => ({
  requireGuestSession: vi.fn(() => Promise.resolve({ user: { id: 'test-user' } })),
}));

describe('HelpPage intake', () => {
  it('renders the submit form and my-tickets section for a guest session', async () => {
    render(await HelpPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Help desk' })).toBeInTheDocument();
    expect(screen.getByText('New request')).toBeInTheDocument();
    expect(screen.getByText('My tickets')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit request' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('opens a support-mediated account deletion request with the correct category and guidance', async () => {
    render(await HelpPage({ searchParams: Promise.resolve({ request: 'account-deletion' }) }));

    expect(screen.getByLabelText('Subject')).toHaveValue('Account deletion request');
    expect(screen.getByLabelText('Category')).toHaveValue('account');
    expect(screen.getByLabelText('Description')).toHaveValue(
      'I would like to request deletion of my C1RCLE account. Please verify my identity and let me know the next steps.',
    );
    expect(
      screen.getByText(/your account is not deleted by submitting this ticket/i),
    ).toBeInTheDocument();
  });
});

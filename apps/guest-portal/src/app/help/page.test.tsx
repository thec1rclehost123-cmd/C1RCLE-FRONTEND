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
});
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import TicketsPage from './page';

describe('TicketsPage (Logged-Out State)', () => {
  it('renders tickets header, hero copy, and login CTA buttons', () => {
    render(<TicketsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'TICKETS' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /YOUR PASS TO THE CIRCLE/i })).toBeInTheDocument();

    const loginBtn = screen.getByRole('link', { name: /LOGIN TO ACCESS/i });
    expect(loginBtn).toBeInTheDocument();
    expect(loginBtn).toHaveAttribute('href', '/login');

    const signupBtn = screen.getByRole('link', { name: /SIGN UP/i });
    expect(signupBtn).toBeInTheDocument();
    expect(signupBtn).toHaveAttribute('href', '/login?mode=register');
  });

  it('renders ticket tier cards and allows navigating carousel', () => {
    render(<TicketsPage />);

    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('GENERAL')).toBeInTheDocument();
    expect(screen.getByText('STAG')).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /Next ticket/i });
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);
  });
});

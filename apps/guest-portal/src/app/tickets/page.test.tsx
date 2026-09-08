import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { clearSession, useSessionStore } from '@c1rcle/auth';

import TicketsPage from './page';

describe('TicketsPage fixture wallet', () => {
  beforeEach(() => {
    clearSession();
  });

  it('renders the logged-out guest ticket showcase without wallet passes', () => {
    render(<TicketsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'TICKETS' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'YOUR PASS TO THE CIRCLE' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select VIP ticket tier' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LOGIN TO ACCESS' })).toHaveAttribute('href', '/login');
    expect(screen.queryByText('AFTER HOURS: TECHNO RITUAL')).not.toBeInTheDocument();
    expect(screen.queryByText('NEON RITUAL VOL. 3')).not.toBeInTheDocument();
  });

  it('renders the fixture wallet only for an authenticated session', () => {
    useSessionStore.setState({ accessToken: 'fixture-access-token', status: 'authenticated' });
    render(<TicketsPage />);

    expect(screen.getByRole('button', { name: 'CURRENT PASSES' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HISTORY' })).toBeInTheDocument();
    expect(screen.getByText('AFTER HOURS: TECHNO RITUAL')).toBeInTheDocument();
    expect(screen.getByText('NEON RITUAL VOL. 3')).toBeInTheDocument();
  });

  it('switches to history tab and displays past tickets', () => {
    useSessionStore.setState({ accessToken: 'fixture-access-token', status: 'authenticated' });
    render(<TicketsPage />);

    const historyTab = screen.getByRole('button', { name: 'HISTORY' });
    fireEvent.click(historyTab);

    expect(screen.getByText('KINETIC NIGHTS VOL. 4')).toBeInTheDocument();
  });

  it('opens a deliberately non-scannable ticket preview', () => {
    useSessionStore.setState({ accessToken: 'fixture-access-token', status: 'authenticated' });
    render(<TicketsPage />);

    const viewPassButtons = screen.getAllByRole('button', { name: 'VIEW PASS PREVIEW' });
    const firstBtn = viewPassButtons[0];
    expect(firstBtn).toBeDefined();
    if (firstBtn) {
      fireEvent.click(firstBtn);
    }

    expect(screen.getByText(/DECORATIVE PASS PREVIEW/i)).toBeInTheDocument();
    expect(screen.getByText(/NOT VALID FOR ENTRY/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Close ticket view' });
    fireEvent.click(closeBtn);
  });
});

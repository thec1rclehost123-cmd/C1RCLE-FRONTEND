import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import TicketsPage from './page';

describe('TicketsPage (Logged-In & Guest State)', () => {
  it('renders logged-in tickets wallet view by default', () => {
    render(<TicketsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'TICKETS' })).toBeInTheDocument();
    expect(screen.getByText('YOUR COLLECTION')).toBeInTheDocument();
    expect(screen.getByText('AFTER HOURS: TECHNO RITUAL')).toBeInTheDocument();
    expect(screen.getByText('NEON RITUAL VOL. 3')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'CURRENT PASSES' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HISTORY' })).toBeInTheDocument();
  });

  it('switches to history tab and displays past tickets', () => {
    render(<TicketsPage />);

    const historyTab = screen.getByRole('button', { name: 'HISTORY' });
    fireEvent.click(historyTab);

    expect(screen.getByText('KINETIC NIGHTS VOL. 4')).toBeInTheDocument();
  });

  it('opens and closes ticket detail QR modal', () => {
    render(<TicketsPage />);

    const viewQrButtons = screen.getAllByRole('button', { name: 'VIEW TICKET QR' });
    const firstBtn = viewQrButtons[0];
    expect(firstBtn).toBeDefined();
    if (firstBtn) {
      fireEvent.click(firstBtn);
    }

    expect(screen.getByText(/ENTRY PASS/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Close ticket view' });
    fireEvent.click(closeBtn);
  });

  it('allows toggling to guest showcase view', () => {
    render(<TicketsPage />);

    const guestToggleBtn = screen.getByRole('button', { name: 'GUEST SHOWCASE' });
    fireEvent.click(guestToggleBtn);

    expect(screen.getByRole('link', { name: /LOGIN TO ACCESS/i })).toBeInTheDocument();
  });
});

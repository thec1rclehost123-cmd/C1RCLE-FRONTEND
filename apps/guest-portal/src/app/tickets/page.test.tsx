import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import TicketsPage from './page';

describe('TicketsPage fixture wallet', () => {
  it('renders the fixture wallet without a fake authentication switch', () => {
    render(<TicketsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'TICKETS' })).toBeInTheDocument();
    expect(screen.getByText('YOUR COLLECTION')).toBeInTheDocument();
    expect(screen.getByText('AFTER HOURS: TECHNO RITUAL')).toBeInTheDocument();
    expect(screen.getByText('NEON RITUAL VOL. 3')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'CURRENT PASSES' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HISTORY' })).toBeInTheDocument();
    expect(screen.queryByText(/No valid tickets issued/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Checkout UI preview/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'LOGGED IN' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'GUEST SHOWCASE' })).not.toBeInTheDocument();
  });

  it('switches to history tab and displays past tickets', () => {
    render(<TicketsPage />);

    const historyTab = screen.getByRole('button', { name: 'HISTORY' });
    fireEvent.click(historyTab);

    expect(screen.getByText('KINETIC NIGHTS VOL. 4')).toBeInTheDocument();
  });

  it('opens a deliberately non-scannable ticket preview', () => {
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

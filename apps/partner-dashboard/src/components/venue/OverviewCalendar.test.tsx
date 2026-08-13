import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OverviewCalendar } from './OverviewCalendar';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AddIcon: Icon,
    ArchiveIcon: Icon,
    CalendarIcon: Icon,
    CloseIcon: Icon,
    ExternalLinkIcon: Icon,
    ListViewIcon: Icon,
    NextIcon: Icon,
    PreviousIcon: Icon,
    SearchIcon: Icon,
    TimeIcon: Icon,
  };
});

describe('OverviewCalendar', () => {
  it('opens as a full calendar dialog and exposes event and view controls', async () => {
    const user = userEvent.setup();
    render(<OverviewCalendar />);
    const trigger = screen.getByRole('button', { name: 'Pop-out calendar' });

    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'July 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Neon Nights: Afrobeats Edition, 10:00 PM' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Block time' }));
    expect(screen.getByRole('status')).toHaveTextContent('Time blocking enabled');
  });

  it('closes with Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<OverviewCalendar />);
    const trigger = screen.getByRole('button', { name: 'Pop-out calendar' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

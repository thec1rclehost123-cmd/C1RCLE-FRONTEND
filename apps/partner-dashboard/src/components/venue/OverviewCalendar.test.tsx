import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OverviewCalendar } from './OverviewCalendar';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { CalendarIcon: Icon, CloseIcon: Icon, ExternalLinkIcon: Icon };
});

describe('OverviewCalendar', () => {
  it('opens, selects a date, closes, and restores focus', async () => {
    const user = userEvent.setup();
    render(<OverviewCalendar />);
    const trigger = screen.getByRole('button', { name: 'Pop-out calendar' });

    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'July 2026' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'July 18, 2026' }));

    expect(screen.queryByRole('dialog', { name: 'July 2026' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
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

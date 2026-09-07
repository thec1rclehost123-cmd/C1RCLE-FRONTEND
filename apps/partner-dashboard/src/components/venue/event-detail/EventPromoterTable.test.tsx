import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildVenueEventDetailRecord, venueEventDetailFixture } from '../event-detail-model';

import { EventPromoterTable } from './EventPromoterTable';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CloseIcon: Icon,
    CopyIcon: Icon,
    InviteIcon: Icon,
    LinkIcon: Icon,
    PhoneIcon: Icon,
    TicketIcon: Icon,
  };
});

const model = buildVenueEventDetailRecord(venueEventDetailFixture).promoters;

describe('EventPromoterTable', () => {
  it('traps drawer focus, closes with Escape, and restores the Contact trigger', async () => {
    const user = userEvent.setup();
    if (!model) throw new Error('Fixture promoter model is required');
    render(<EventPromoterTable model={model} />);
    const firstRow = screen.getByText('Karan Shah').closest('tr');
    if (!firstRow) throw new Error('Promoter row is required');
    const trigger = within(firstRow).getByRole('button', { name: 'Contact' });

    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Karan Shah' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close promoter details' })).toHaveFocus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: 'Copy link' })).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('copies the selected promoter link with accessible confirmation', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    if (!model) throw new Error('Fixture promoter model is required');
    render(<EventPromoterTable model={model} />);
    const firstRow = screen.getByText('Karan Shah').closest('tr');
    if (!firstRow) throw new Error('Promoter row is required');
    await user.click(within(firstRow).getByRole('button', { name: 'Contact' }));

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith('https://thec1rcle.com/p/karan-shah');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByText('Promoter link copied')).toBeInTheDocument();
  });
});

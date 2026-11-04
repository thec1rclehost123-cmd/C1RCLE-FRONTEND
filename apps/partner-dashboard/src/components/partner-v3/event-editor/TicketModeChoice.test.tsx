import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TicketTierEditor } from './EventEditorParts';

import type { EventEditorTicketTier } from '@/data/partner-data-source';

vi.mock('next/image', () => ({ default: () => <span /> }));
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
function Editor() {
  const [tiers, setTiers] = useState<readonly EventEditorTicketTier[]>([]);
  return (
    <>
      <TicketTierEditor tiers={tiers} onChange={setTiers} />
      <output aria-label="Tier configuration">{JSON.stringify(tiers)}</output>
    </>
  );
}
describe('Ticket entry mode', () => {
  it('asks for a mode before showing tiers', () => {
    render(<Editor />);
    expect(screen.getByRole('radio', { name: 'RSVP' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Sell tickets' })).not.toBeChecked();
    expect(screen.queryByRole('button', { name: '+ Add ticket tier' })).not.toBeInTheDocument();
  });
  it('creates a free RSVP tier with one ticket per order', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.click(screen.getByRole('radio', { name: 'RSVP' }));
    await user.click(screen.getByRole('button', { name: 'Edit Free RSVP' }));
    expect(screen.getByLabelText('Free RSVP maximum per order')).toHaveValue(1);
    expect(screen.getByLabelText('Free RSVP maximum per order')).toHaveAttribute('readonly');
    expect(screen.queryByLabelText('Free RSVP price')).not.toBeInTheDocument();
    expect(
      (
        JSON.parse(
          screen.getByLabelText('Tier configuration').textContent,
        ) as EventEditorTicketTier[]
      )[0],
    ).toMatchObject({ accessType: 'RSVP', price: 0, maxPerOrder: 1, commissionEligible: false });
  });
  it('keeps paid configuration when toggling modes', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.click(screen.getByRole('radio', { name: 'Sell tickets' }));
    await user.click(screen.getByRole('button', { name: 'Edit General Entry' }));
    const price = screen.getByLabelText('General Entry price');
    await user.clear(price);
    await user.type(price, '500');
    expect(screen.getByLabelText('General Entry maximum per order')).toHaveValue(10);
    await user.click(screen.getByRole('button', { name: 'Save ticket' }));
    await user.click(screen.getByRole('radio', { name: 'RSVP' }));
    await user.click(screen.getByRole('radio', { name: 'Sell tickets' }));
    await user.click(screen.getByRole('button', { name: 'Edit General Entry' }));
    expect(screen.getByLabelText('General Entry price')).toHaveValue('500');
  });
  it('creates a couple preset and saves its description without losing guest semantics', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.click(screen.getByRole('radio', { name: 'Sell tickets' }));
    expect(screen.queryByRole('button', { name: '+ Couple' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ Add ticket tier' }));
    await user.selectOptions(screen.getByLabelText('Ticket template'), 'Couple');
    expect(screen.getByRole('dialog', { name: 'Edit ticket' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Ticket description'), 'Entry for two');
    await user.click(screen.getByRole('button', { name: 'Save ticket' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const tiers = JSON.parse(
      screen.getByLabelText('Tier configuration').textContent,
    ) as EventEditorTicketTier[];
    expect(tiers[1]).toMatchObject({
      name: 'Couple',
      guestCount: 2,
      audienceType: 'COUPLE',
      admissionMode: 'bundle',
      benefits: ['Entry for two'],
    });
  });
  it('cancels edits and preserves the saved price', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.click(screen.getByRole('radio', { name: 'Sell tickets' }));
    await user.click(screen.getByRole('button', { name: 'Edit General Entry' }));
    await user.type(screen.getByLabelText('General Entry price'), '500');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Edit General Entry' }));
    expect(screen.getByLabelText('General Entry price')).toHaveValue('0');
  });
  it('removes a tier directly from its row', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.click(screen.getByRole('radio', { name: 'Sell tickets' }));
    await user.click(screen.getByRole('button', { name: 'Remove General Entry' }));
    expect(screen.queryByRole('button', { name: 'Edit General Entry' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tier configuration')).toHaveTextContent('[]');
  });
  it('applies free female semantics from the template dropdown', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.click(screen.getByRole('radio', { name: 'Sell tickets' }));
    await user.click(screen.getByRole('button', { name: '+ Add ticket tier' }));
    await user.selectOptions(screen.getByLabelText('Ticket template'), 'Free Female');
    expect(screen.getByLabelText('Free Female maximum per order')).toHaveValue(1);
    expect(screen.queryByLabelText('Free Female price')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save ticket' }));
    const tiers = JSON.parse(
      screen.getByLabelText('Tier configuration').textContent,
    ) as EventEditorTicketTier[];
    expect(tiers[1]).toMatchObject({
      name: 'Free Female',
      audienceType: 'FEMALE',
      accessType: 'RSVP',
      price: 0,
      maxPerOrder: 1,
    });
  });
});

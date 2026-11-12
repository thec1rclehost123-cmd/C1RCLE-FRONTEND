import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';

import { TicketTierEditor } from './EventEditorParts';

import type { EventEditorTicketTier } from '@/data/partner-data-source';

function renderEditor(
  initial: EventEditorTicketTier = { id: 'tier-1', name: 'General', price: 1000, quantity: 100 },
) {
  let tiers = [initial];
  const onChange = (next: readonly EventEditorTicketTier[]) => {
    tiers = [...next];
    rerender(<TicketTierEditor tiers={tiers} onChange={onChange} />);
  };
  const view = render(<TicketTierEditor tiers={tiers} onChange={onChange} />);
  const rerender = view.rerender;
  return view;
}

async function openTicketOptions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Edit General' }));
  await user.click(screen.getByText('Entry & pricing options', { exact: true }));
}

describe('TicketTierEditor ticket dimensions', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    });
  });
  it('edits access, audience, guest count, door price, benefits, and user limit', async () => {
    const user = userEvent.setup();
    renderEditor();
    await openTicketOptions(user);

    await user.selectOptions(screen.getByLabelText('Ticket type / access'), 'VIP');
    expect(screen.queryByRole('option', { name: 'Student' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Member' })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Audience'), 'COUPLE');
    expect(screen.getByLabelText('Guests')).toHaveValue(2);
    expect(screen.getByLabelText('Guests')).toBeDisabled();
    expect(screen.queryByLabelText('Admission issuance')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Door price (₹)'), '2500');
    await user.type(screen.getByLabelText('Ticket description'), 'Entry, Drinks');
    await user.type(screen.getByLabelText('Max per user'), '2');

    expect(screen.getByLabelText('Ticket type / access')).toHaveValue('VIP');
    expect(screen.getByLabelText('Audience')).toHaveValue('COUPLE');
    expect(screen.getByLabelText('Guests')).toHaveValue(2);
    expect(screen.getByLabelText('Door price (₹)')).toHaveValue(2500);
    expect(screen.getByLabelText('Ticket description')).toHaveValue('Entry, Drinks');
    expect(screen.getByLabelText('Max per user')).toHaveValue(2);
  });

  it('shows table configuration only for table access', async () => {
    const user = userEvent.setup();
    renderEditor();
    await openTicketOptions(user);

    expect(screen.queryByLabelText('Table capacity')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Ticket type / access'), 'TABLE');
    expect(screen.getByLabelText('Table capacity')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum spend (₹)')).toBeInTheDocument();
    expect(screen.getByLabelText('Redeemable (₹)')).toBeInTheDocument();
  });

  it('adds a pricing phase with the existing tier price', async () => {
    const user = userEvent.setup();
    renderEditor();
    await openTicketOptions(user);

    await user.click(screen.getByRole('button', { name: '+ Add pricing phase' }));
    expect(screen.getByLabelText('Phase 1 phase name')).toHaveValue('Phase 1');
    expect(screen.getByLabelText('Phase 1 phase price')).toHaveValue(1000);
    expect(screen.getByLabelText('Phase 1 phase start date')).toBeInTheDocument();
    expect(screen.getByLabelText('Phase 1 phase end date')).toBeInTheDocument();
  });

  it('removes one pricing phase and keeps the remaining phase editable', async () => {
    const user = userEvent.setup();
    renderEditor({
      id: 'tier-1',
      name: 'General',
      price: 1000,
      quantity: 100,
      pricingPhases: [
        {
          id: 'phase-1',
          name: 'Early Bird',
          priceInPaise: 80000,
          startDate: '12-11',
          endDate: '17-11',
          quantity: null,
        },
        {
          id: 'phase-2',
          name: 'Final Release',
          priceInPaise: 120000,
          startDate: '18-11',
          endDate: '23-11',
          quantity: null,
        },
      ],
    });
    await openTicketOptions(user);

    await user.click(screen.getByRole('button', { name: 'Remove Early Bird phase' }));

    expect(screen.queryByLabelText('Early Bird phase name')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Final Release phase name')).toHaveValue('Final Release');
    expect(screen.getByLabelText('Final Release phase price')).toHaveValue(1200);

    await user.click(screen.getByRole('button', { name: '+ Add pricing phase' }));

    expect(screen.getByLabelText('Phase 3 phase name')).toHaveValue('Phase 3');
    expect(screen.getByLabelText('Phase 3 phase price')).toHaveValue(1000);
  });
});

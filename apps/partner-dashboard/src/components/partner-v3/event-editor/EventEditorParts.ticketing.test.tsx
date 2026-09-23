import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TicketTierEditor } from './EventEditorParts';

import type { EventEditorTicketTier } from '@/data/partner-data-source';

function renderEditor(initial: EventEditorTicketTier = { id: 'tier-1', name: 'General', price: 1000, quantity: 100 }) {
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
  await user.click(screen.getByText('Ticket options', { exact: true }));
}

describe('TicketTierEditor ticket dimensions', () => {
  it('edits access, audience, guest count, door price, benefits, and user limit', async () => {
    const user = userEvent.setup();
    renderEditor();
    await openTicketOptions(user);

    await user.selectOptions(screen.getByLabelText('Access'), 'VIP');
    await user.selectOptions(screen.getByLabelText('Audience'), 'COUPLE');
    await user.clear(screen.getByLabelText('Guests'));
    await user.type(screen.getByLabelText('Guests'), '2');
    await user.type(screen.getByLabelText('Door price (₹)'), '2500');
    await user.type(screen.getByLabelText('Benefits'), 'Entry, Drinks');
    await user.type(screen.getByLabelText('Max per user'), '2');

    expect(screen.getByLabelText('Access')).toHaveValue('VIP');
    expect(screen.getByLabelText('Audience')).toHaveValue('COUPLE');
    expect(screen.getByLabelText('Guests')).toHaveValue(2);
    expect(screen.getByLabelText('Door price (₹)')).toHaveValue(2500);
    expect(screen.getByLabelText('Benefits')).toHaveValue('Entry, Drinks');
    expect(screen.getByLabelText('Max per user')).toHaveValue(2);
  });

  it('shows table configuration only for table access', async () => {
    const user = userEvent.setup();
    renderEditor();
    await openTicketOptions(user);

    expect(screen.queryByLabelText('Table capacity')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Access'), 'TABLE');
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
    expect(screen.getByLabelText('Phase 1 phase starts')).toBeInTheDocument();
    expect(screen.getByLabelText('Phase 1 phase ends')).toBeInTheDocument();
  });
});

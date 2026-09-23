import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { EventPromoterSelector } from './EventEditorParts';

import type { EventEditorData, EventEditorDraft } from '@/data/partner-data-source';

const testData: EventEditorData = {
  dataStatus: 'fixture',
  role: 'venue',
  accent: 'orange',
  artworkOptions: [],
  venues: [],
  promoters: [
    { id: 'promoter-1', name: 'Alex Promoter', initials: 'AP', role: 'Promoter' },
    { id: 'promoter-2', name: 'Sam Promoter', initials: 'SP', role: 'Promoter' },
  ],
};

function renderPromoterSelector(initialDraft?: Partial<EventEditorDraft>) {
  let draft: EventEditorDraft = {
    name: 'Party Night',
    venueId: 'v1',
    date: '2026-10-01',
    dateLabel: 'Thu, Oct 1',
    time: '21:00',
    genres: [],
    artists: [],
    artwork: { type: 'gradient', value: 'sunset' },
    ticketTiers: [
      { id: 'tier-1', name: 'General Admission', price: 1000, quantity: 100 },
      { id: 'tier-2', name: 'VIP Pass', price: 2500, quantity: 20 },
    ],
    selectedPromoterIds: ['promoter-1'],
    tableType: 'none',
    promoCodes: [],
    pricingRule: '',
    compensation: 'standard',
    commissionRate: 15,
    salaryAmount: 0,
    salaryPeriod: 'per_event',
    salaryNotes: '',
    ...initialDraft,
  };

  const update = (next: Partial<EventEditorDraft>) => {
    draft = { ...draft, ...next };
    rerender(<EventPromoterSelector data={testData} draft={draft} update={update} />);
  };

  const view = render(<EventPromoterSelector data={testData} draft={draft} update={update} />);
  const rerender = view.rerender;
  return { ...view, getDraft: () => draft };
}

describe('EventPromoterSelector compensation models and promoter overrides', () => {
  it('1. Standard Commission mode: configures global commission rate and promoter override', async () => {
    const user = userEvent.setup();
    const { getDraft } = renderPromoterSelector({ compensation: 'standard', commissionRate: 15 });

    // Select standard model button
    await user.click(screen.getByRole('button', { name: /^Standard Commission/i }));

    // Global commission input
    const globalCommissionInput = screen.getByLabelText('Global Commission (%)');
    expect(globalCommissionInput).toHaveValue(15);
    await user.clear(globalCommissionInput);
    await user.type(globalCommissionInput, '18');
    expect(getDraft().commissionRate).toBe(18);

    // Promoter override for Alex Promoter
    expect(screen.getAllByText('Alex Promoter')).toHaveLength(2);
    expect(screen.getByText('Event default')).toBeInTheDocument();

    const overrideBtn = screen.getByRole('button', { name: '+ Set custom commission' });
    await user.click(overrideBtn);

    expect(getDraft().promoterOverrides?.['promoter-1']).toEqual({ default: 18 });
    expect(screen.getByText('Custom override')).toBeInTheDocument();

    const customRateInput = screen.getByLabelText('Alex Promoter custom commission percentage');
    expect(customRateInput).toHaveValue(18);

    await user.clear(customRateInput);
    await user.type(customRateInput, '25');

    expect(getDraft().promoterOverrides?.['promoter-1']).toEqual({ default: 25 });
  });

  it('2. Custom Tier Commission mode: configures per-tier rates and per-tier promoter overrides', async () => {
    const user = userEvent.setup();
    const { getDraft } = renderPromoterSelector({
      compensation: 'custom',
      tierCommissions: { 'tier-1': 10, 'tier-2': 15 },
    });

    // Select custom model button
    await user.click(screen.getByRole('button', { name: /^Custom Commission/i }));

    const gaInput = screen.getByLabelText('General Admission commission percentage');
    const vipInput = screen.getByLabelText('VIP Pass commission percentage');

    expect(gaInput).toHaveValue(10);
    expect(vipInput).toHaveValue(15);

    await user.clear(vipInput);
    await user.type(vipInput, '20');
    expect(getDraft().tierCommissions).toEqual({ 'tier-1': 10, 'tier-2': 20 });

    // Set custom override for promoter
    await user.click(screen.getByRole('button', { name: '+ Set custom commission' }));

    const customGaInput = screen.getByLabelText('Alex Promoter General Admission custom commission');
    const customVipInput = screen.getByLabelText('Alex Promoter VIP Pass custom commission');

    expect(customGaInput).toHaveValue(10);
    expect(customVipInput).toHaveValue(20);

    await user.clear(customGaInput);
    await user.type(customGaInput, '12');

    expect(getDraft().promoterOverrides?.['promoter-1']).toEqual({ 'tier-1': 12, 'tier-2': 20 });
  });

  it('3. Salary Based mode: configures salary details and custom promoter salary override', async () => {
    const user = userEvent.setup();
    const { getDraft } = renderPromoterSelector({
      compensation: 'salary',
      salaryAmount: 5000,
      salaryPeriod: 'per_event',
      salaryNotes: 'Covered by flat promoter fee',
    });

    // Select salary model button
    await user.click(screen.getByRole('button', { name: /^Salary Based/i }));

    const salaryAmountInput = screen.getByLabelText('Salary amount (₹)');
    const salaryBasisSelect = screen.getByLabelText('Salary basis');
    const salaryNotesTextarea = screen.getByLabelText('Salary notes');

    expect(salaryAmountInput).toHaveValue(5000);
    expect(salaryBasisSelect).toHaveValue('per_event');
    expect(salaryNotesTextarea).toHaveValue('Covered by flat promoter fee');

    await user.clear(salaryAmountInput);
    await user.type(salaryAmountInput, '7500');
    expect(getDraft().salaryAmount).toBe(7500);

    await user.selectOptions(salaryBasisSelect, 'per_month');
    expect(getDraft().salaryPeriod).toBe('per_month');

    // Promoter override in salary mode
    await user.click(screen.getByRole('button', { name: '+ Set custom commission' }));

    const customSalaryInput = screen.getByLabelText('Alex Promoter custom salary amount');
    expect(customSalaryInput).toHaveValue(7500);

    await user.clear(customSalaryInput);
    await user.type(customSalaryInput, '10000');

    expect(getDraft().promoterOverrides?.['promoter-1']).toEqual({ default: 10000 });
  });

  it('toggles promoter selection and reverts promoter override back to event default', async () => {
    const user = userEvent.setup();
    const { getDraft } = renderPromoterSelector({
      promoterOverrides: { 'promoter-1': { default: 20 } },
    });

    expect(screen.getByText('Custom override')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use Event Default' }));

    expect(getDraft().promoterOverrides?.['promoter-1']).toBeUndefined();
    expect(screen.getByText('Event default')).toBeInTheDocument();
  });
});

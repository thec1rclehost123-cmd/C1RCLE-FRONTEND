import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildVenueEventDetailRecord, venueEventDetailFixture } from '../event-detail-model';

import { VenueEventGuestsScreen } from './VenueEventGuestsScreen';

const mocks = vi.hoisted(() => ({
  canDo: vi.fn<(action: string) => boolean>(),
  go: vi.fn(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CloseIcon: Icon,
    ExportIcon: Icon,
    FilterIcon: Icon,
    SearchIcon: Icon,
    SendIcon: Icon,
  };
});
vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({ canDo: mocks.canDo }),
}));
vi.mock('../store', () => ({ useVenueStudio: () => ({ go: mocks.go }) }));

const model = buildVenueEventDetailRecord(venueEventDetailFixture).guests;

describe('VenueEventGuestsScreen', () => {
  beforeEach(() => {
    mocks.canDo.mockReset();
    mocks.canDo.mockReturnValue(true);
  });

  it('searches and filters the guest list', async () => {
    const user = userEvent.setup();
    render(<VenueEventGuestsScreen model={model} />);

    await user.selectOptions(screen.getByLabelText('Ticket type'), 'VIP Table');
    expect(screen.getByText('Aisha Menon')).toBeInTheDocument();
    expect(screen.queryByText('Arjun Patel')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search guests...'), 'tara');
    expect(screen.getByText('Tara Desai')).toBeInTheDocument();
    expect(screen.queryByText('Aisha Menon')).not.toBeInTheDocument();
  });

  it('opens an accessible guest drawer, traps focus, and restores the trigger on close', async () => {
    const user = userEvent.setup();
    render(<VenueEventGuestsScreen model={model} />);
    const aishaRow = screen.getByText('Aisha Menon').closest('tr');
    if (!aishaRow) throw new Error('Aisha row is required');
    const view = aishaRow.querySelector<HTMLButtonElement>('button');
    if (!view) throw new Error('Aisha view action is required');

    await user.click(view);
    const dialog = screen.getByRole('dialog', { name: 'Aisha Menon' });
    const close = screen.getByRole('button', { name: 'Close guest details' });
    expect(close).toHaveFocus();
    expect(dialog).toHaveTextContent('•••• 4587');

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: 'Send ticket' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(view).toHaveFocus();
  });
});

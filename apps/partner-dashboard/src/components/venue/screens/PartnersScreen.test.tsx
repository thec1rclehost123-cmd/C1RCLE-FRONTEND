import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PartnersScreen } from './PartnersScreen';

const mocks = vi.hoisted(() => ({
  canDo: vi.fn(() => true),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CalendarIcon: Icon,
    CheckIcon: Icon,
    CloseIcon: Icon,
    InviteIcon: Icon,
    LocationIcon: Icon,
    PhoneIcon: Icon,
    SearchIcon: Icon,
    SendIcon: Icon,
  };
});

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    grantedPermissions: [],
    hasPermission: () => true,
    canDo: mocks.canDo,
  }),
}));

describe('PartnersScreen', () => {
  it('traps the partner drawer and restores focus to the Contact trigger on Escape', async () => {
    const user = userEvent.setup();
    render(<PartnersScreen tab="hosts" />);
    const trigger = screen.getAllByRole('button', { name: 'Contact' })[0]!;
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: /Rhea Kapoor partner details/ })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('shows host credibility and expands hosted event history', async () => {
    const user = userEvent.setup();
    render(<PartnersScreen tab="hosts" />);
    await user.click(screen.getAllByRole('button', { name: 'Contact' })[0]!);

    expect(screen.getByRole('heading', { name: 'Credibility' })).toBeInTheDocument();
    expect(screen.getByText('Events hosted')).toBeInTheDocument();
    expect(screen.queryByText('Avg. turnout')).not.toBeInTheDocument();
    expect(screen.queryByText('Venue rebook rate')).not.toBeInTheDocument();
    const history = screen.getByRole('button', { name: /See hosted events/ });
    expect(history).toHaveAttribute('aria-expanded', 'false');

    await user.click(history);
    expect(history).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Saturday Sessions')).toBeInTheDocument();
  });

  it('uses promoter-specific credibility labels and history wording', async () => {
    const user = userEvent.setup();
    render(<PartnersScreen tab="promoters" />);
    await user.click(screen.getAllByRole('button', { name: 'Contact' })[0]!);

    expect(screen.queryByText('Tickets attributed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /See promoted events/ })).toBeInTheDocument();
  });

  it('keeps unsupported promoter invitations honest', () => {
    render(<PartnersScreen tab="promoters" />);
    const invite = screen.getByRole('button', { name: 'Invite promoter unavailable' });
    expect(invite).toBeDisabled();
    expect(screen.queryByText(/invite sent successfully/i)).not.toBeInTheDocument();
  });
});

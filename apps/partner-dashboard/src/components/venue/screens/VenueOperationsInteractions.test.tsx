import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CreateEventScreen } from './CreateEventScreen';
import { FinanceScreen } from './FinanceScreen';
import { MarketingScreen } from './MarketingScreen';

const mocks = vi.hoisted(() => ({
  permissions: [] as string[],
  actions: new Map<string, boolean>(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AddIcon: Icon,
    BackIcon: Icon,
    BankIcon: Icon,
    CalendarIcon: Icon,
    CheckIcon: Icon,
    ChevronDownIcon: Icon,
    DeleteIcon: Icon,
    EditIcon: Icon,
    EmailIcon: Icon,
    ExportIcon: Icon,
    ForwardIcon: Icon,
    ImageIcon: Icon,
    LocationIcon: Icon,
    NotificationIcon: Icon,
    PublishIcon: Icon,
    RequestPayoutIcon: Icon,
    SearchIcon: Icon,
    SendIcon: Icon,
    SettingsIcon: Icon,
    SmsIcon: Icon,
    TicketIcon: Icon,
    TimeIcon: Icon,
    TrendUpIcon: Icon,
    WhatsAppIcon: Icon,
  };
});

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    grantedPermissions: mocks.permissions,
    hasPermission: (permission: string) => mocks.permissions.includes(permission),
    canDo: (action: string) => mocks.actions.get(action) ?? true,
  }),
}));

describe('Venue operations interactions', () => {
  it('populates the existing composer from a selected template', () => {
    render(<MarketingScreen tab="compose" templateId="tickets-running-low" />);
    expect(screen.getByRole('textbox', { name: /Message/ })).toHaveValue(
      'Tickets are almost gone for your event.',
    );
  });

  it('hides payout requests when the action permission is denied', () => {
    mocks.actions = new Map([['canManageFinance', false]]);
    render(<FinanceScreen />);
    expect(screen.queryByRole('button', { name: /Request payout/ })).not.toBeInTheDocument();
  });

  it('keeps data across all three Create Event steps and publishes through the supplied mutation', async () => {
    mocks.actions = new Map([
      ['canEditEvent', true],
      ['canPublishEvent', true],
    ]);
    const user = userEvent.setup();
    const publish = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateEventScreen
        mutations={{ saveDraft: vi.fn().mockResolvedValue(undefined), publish }}
      />,
    );

    const name = screen.getByLabelText('Event name');
    await user.clear(name);
    await user.type(name, 'Friday Frequency');
    await user.click(screen.getByRole('button', { name: /Continue to tickets/ }));
    expect(screen.getByRole('heading', { name: 'Tickets' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Continue to review/ }));
    expect(screen.getByText(/Friday Frequency · Thu, 24 Sep 2026/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Publish event' }));
    expect(publish).toHaveBeenCalledWith(expect.objectContaining({ name: 'Friday Frequency' }));
  });
});

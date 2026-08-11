import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildVenueEventDetailRecord, venueEventDetailFixture } from '../event-detail-model';

import { VenueEventFinanceScreen } from './VenueEventFinanceScreen';

const mocks = vi.hoisted(() => ({
  permissions: [] as string[],
  canDo: vi.fn<(action: string) => boolean>(),
  goBank: vi.fn(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { BankIcon: Icon, LockedIcon: Icon };
});
vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({ grantedPermissions: mocks.permissions, canDo: mocks.canDo }),
}));
vi.mock('../store', () => ({ useVenueStudio: () => ({ goBank: mocks.goBank }) }));

const model = buildVenueEventDetailRecord(venueEventDetailFixture).finance;

describe('VenueEventFinanceScreen', () => {
  beforeEach(() => {
    mocks.permissions = [];
    mocks.canDo.mockReset();
  });

  it('blocks sensitive finance content without the coarse permission', () => {
    mocks.permissions = ['VIEW_EVENTS'];
    render(<VenueEventFinanceScreen model={model} />);
    expect(screen.getByText('Finance access is required.')).toBeInTheDocument();
    expect(screen.queryByText('Payout breakdown')).not.toBeInTheDocument();
  });

  it('renders an explicit unavailable state instead of authoritative zeroes', () => {
    render(<VenueEventFinanceScreen model={null} />);
    expect(screen.getByText('Financial details are unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('₹0')).not.toBeInTheDocument();
  });

  it('omits payout management without action permission', () => {
    mocks.canDo.mockReturnValue(false);
    render(<VenueEventFinanceScreen model={model} />);
    expect(screen.getByText('Payout breakdown')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage' })).not.toBeInTheDocument();
  });
});

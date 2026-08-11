import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyEventLinkAction, CreateEventMessageAction } from './EventMarketingActions';

const mocks = vi.hoisted(() => ({
  permissions: [] as string[],
  setCAudience: vi.fn(),
  go: vi.fn(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { CopyIcon: Icon, EditIcon: Icon };
});
vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({ grantedPermissions: mocks.permissions }),
}));
vi.mock('../store', () => ({
  useVenueStudio: () => ({
    setCAudience: mocks.setCAudience,
    go: mocks.go,
  }),
}));

describe('EventMarketingActions', () => {
  beforeEach(() => {
    mocks.permissions = [];
    mocks.setCAudience.mockReset();
    mocks.go.mockReset();
  });

  it('opens the existing composer with the current event audience selected', async () => {
    const user = userEvent.setup();
    render(<CreateEventMessageAction label="Create message" />);

    await user.click(screen.getByRole('button', { name: 'Create message' }));
    expect(mocks.setCAudience).toHaveBeenCalledWith('event');
    expect(mocks.go).toHaveBeenCalledWith('marketing');
  });

  it('omits message actions when explicit coarse permissions exclude Marketing', () => {
    mocks.permissions = ['VIEW_EVENTS'];
    render(<CreateEventMessageAction label="Create message" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('copies the authoritative event URL and announces confirmation', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<CopyEventLinkAction eventUrl="https://thec1rcle.com/e/neon-nights" />);

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith('https://thec1rcle.com/e/neon-nights');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByText('Event link copied')).toBeInTheDocument();
  });
});

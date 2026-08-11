import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InvitePromoterAction } from './EventPromoterTable';

const mocks = vi.hoisted(() => ({ canDo: vi.fn<(action: string) => boolean>() }));

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
vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({ canDo: mocks.canDo }),
}));

describe('InvitePromoterAction', () => {
  beforeEach(() => mocks.canDo.mockReset());

  it('omits the invitation action without permission', () => {
    mocks.canDo.mockReturnValue(false);
    render(<InvitePromoterAction />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows an honest unavailable form without faking submission', async () => {
    const user = userEvent.setup();
    mocks.canDo.mockReturnValue(true);
    render(<InvitePromoterAction />);

    await user.click(screen.getByRole('button', { name: 'Invite promoter' }));
    expect(screen.getByRole('dialog', { name: 'Invite promoter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send invite unavailable' })).toBeDisabled();
    expect(screen.getByText(/No invite will be sent/)).toBeInTheDocument();
  });
});

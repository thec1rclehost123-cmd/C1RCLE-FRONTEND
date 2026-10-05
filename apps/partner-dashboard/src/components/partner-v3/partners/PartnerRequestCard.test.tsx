import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PartnerRequestCard } from './PartnerRequestCard';

import type { PartnerRequest } from '@/data/partner-data-source';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getActiveOrgId: vi.fn((): string | null => 'org_venue'),
  resolvePartnership: vi.fn<(...args: never[]) => Promise<unknown>>(),
  resolvePromoterConnection: vi.fn<(...args: never[]) => Promise<unknown>>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: () => mocks.getActiveOrgId(),
}));

vi.mock('@/lib/partner/api-partnerships-repository', () => ({
  resolvePartnership: (...args: never[]): Promise<unknown> =>
    mocks.resolvePartnership(...args) as Promise<unknown>,
}));

vi.mock('@/lib/partner/promoter-connection-repository', () => ({
  resolvePromoterConnection: (...args: never[]): Promise<unknown> =>
    mocks.resolvePromoterConnection(...args) as Promise<unknown>,
}));

const partnershipRequest: PartnerRequest = {
  id: 'part_1',
  name: 'Live Host',
  initials: 'LH',
  kind: 'host',
  direction: 'incoming',
  note: 'Hello',
  target: { graph: 'partnership', id: 'part_1' },
};

const promoterRequest: PartnerRequest = {
  id: 'conn_1',
  name: 'Live Promoter',
  initials: 'LP',
  kind: 'promoter',
  direction: 'incoming',
  note: '',
  target: { graph: 'promoter-connection', id: 'conn_1' },
};

describe('PartnerRequestCard', () => {
  it('accepts a partnership request through the mutation API and refreshes', async () => {
    const user = userEvent.setup();
    mocks.resolvePartnership.mockResolvedValue({});
    render(<PartnerRequestCard request={partnershipRequest} />);

    const accept = screen.getByRole('button', { name: 'Accept' });
    expect(accept).toBeEnabled();
    await user.click(accept);

    await waitFor(() => {
      expect(mocks.resolvePartnership).toHaveBeenCalledWith(
        'org_venue',
        'part_1',
        'approve',
        undefined,
      );
    });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('declines a promoter-connection request through its mutation API', async () => {
    const user = userEvent.setup();
    mocks.resolvePromoterConnection.mockResolvedValue({});
    render(<PartnerRequestCard request={promoterRequest} />);

    await user.click(screen.getByRole('button', { name: 'Decline' }));

    await waitFor(() => {
      expect(mocks.resolvePromoterConnection).toHaveBeenCalledWith(
        'org_venue',
        'conn_1',
        'reject',
        undefined,
      );
    });
  });

  it('keeps actions disabled for rows without a backend target', () => {
    render(
      <PartnerRequestCard
        request={{
          id: 'fix_1',
          name: 'Fix',
          initials: 'F',
          kind: 'host',
          direction: 'incoming',
          note: '',
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled();
  });
});

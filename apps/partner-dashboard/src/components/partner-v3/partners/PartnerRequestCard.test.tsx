import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PartnerRequestCard } from './PartnerRequestCard';

import type { PartnerRequest } from '@/data/partner-data-source';

const mocks = vi.hoisted(() => ({
  resolvePartnership: vi.fn<(
    organizationId: string,
    partnershipId: string,
    action: 'approve' | 'reject' | 'block' | 'end',
    options?: { readonly reason?: string; readonly idempotencyKey?: string },
  ) => Promise<unknown>>(),
  resolvePromoterConnection: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/lib/partner/api-partnerships-repository', () => ({ resolvePartnership: mocks.resolvePartnership }));
vi.mock('@/lib/partner/promoter-connection-repository', () => ({ resolvePromoterConnection: mocks.resolvePromoterConnection }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));

const outgoing: PartnerRequest = {
  id: 'partnership_1', name: 'Host One', initials: 'HO', kind: 'host', direction: 'outgoing',
  note: 'Request', canWithdraw: true, target: { graph: 'partnership', id: 'partnership_1' },
};

describe('PartnerRequestCard', () => {
  it('withdraws an outgoing partnership request through the existing end action', async () => {
    const user = userEvent.setup();
    mocks.resolvePartnership.mockResolvedValue({});
    render(<PartnerRequestCard request={outgoing} organizationId="org_1" />);
    await user.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(mocks.resolvePartnership).toHaveBeenCalledTimes(1);
    const call = mocks.resolvePartnership.mock.calls[0];
    expect(call?.slice(0, 3)).toEqual(['org_1', 'partnership_1', 'end']);
    expect(typeof call?.[3]?.idempotencyKey).toBe('string');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('reports withdrawal permission or network failures', async () => {
    const user = userEvent.setup();
    mocks.resolvePartnership.mockRejectedValue(new Error('forbidden'));
    render(<PartnerRequestCard request={outgoing} organizationId="org_1" />);
    await user.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not withdraw this request');
  });
});
